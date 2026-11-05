// Collects a GitHub user's public code review comments.
// Uses a token when one is around (GITHUB_TOKEN, GH_TOKEN or the gh CLI),
// and stays inside the 60 requests an hour GitHub allows without one.

import { execFileSync } from 'node:child_process';

const API = 'https://api.github.com';

export function findToken(env = process.env) {
  if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN.trim();
  if (env.GH_TOKEN) return env.GH_TOKEN.trim();
  try {
    const t = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim();
    return t || null;
  } catch {
    return null;
  }
}

export class RateLimited extends Error {
  constructor(resetAt) {
    super('GitHub rate limit reached');
    this.resetAt = resetAt;
  }
}

function client(fetchImpl, token) {
  return async function get(pathOrUrl) {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : API + pathOrUrl;
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'steal-skill', 'X-GitHub-Api-Version': '2022-11-28' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetchImpl(url, { headers });
    if (res.status === 404) return null;
    if (res.status === 403 || res.status === 429) {
      const left = res.headers.get('x-ratelimit-remaining');
      const reset = Number(res.headers.get('x-ratelimit-reset'));
      if (left === '0' || res.status === 429) throw new RateLimited(reset ? reset * 1000 : null);
    }
    if (res.status === 401) throw new Error('GitHub rejected the token. Check GITHUB_TOKEN or run gh auth login.');
    if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${url.replace(API, '')}`);
    return res.json();
  };
}

const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  let stop = null;
  const worker = async () => {
    while (i < items.length && !stop) {
      const item = items[i++];
      try {
        out.push(await fn(item));
      } catch (e) {
        if (e instanceof RateLimited) stop = e;
        else throw e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return { results: out, limited: stop };
}

// Returns { user, comments, prs, limited }.
export async function collect(login, { fetch: fetchImpl = globalThis.fetch, token = null, maxPRs, onProgress = () => {} } = {}) {
  const get = client(fetchImpl, token);
  let user;
  try {
    user = await get(`/users/${encodeURIComponent(login)}`);
  } catch (e) {
    if (e instanceof RateLimited) throw new Error(limitMessage(e.resetAt, token));
    throw e;
  }
  if (!user) throw new Error(`There is no GitHub user called ${login}.`);
  const who = user.login;
  // Without a token: 1 user + 2 searches + 3 per pull request stays under 60.
  const cap = maxPRs || (token ? 80 : 18);
  const perPage = token ? 100 : 50;

  // Reviewed pull requests first: they carry the inline comments.
  const queries = [`reviewed-by:${who} is:pr -author:${who}`, `commenter:${who} is:pr -author:${who}`];
  const prs = new Map();
  let limited = null;
  for (const q of queries) {
    try {
      const r = await get(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${perPage}`);
      for (const it of (r && r.items) || []) {
        const m = it.html_url && it.html_url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
        if (m && !prs.has(it.html_url)) prs.set(it.html_url, { owner: m[1], repo: m[2], number: Number(m[3]), url: it.html_url, title: it.title });
      }
    } catch (e) {
      if (e instanceof RateLimited) {
        limited = e;
        break;
      }
      throw e;
    }
  }
  const list = [...prs.values()].slice(0, cap);

  let done = 0;
  const { results, limited: hitLimit } = await pool(list, token ? 6 : 3, async (pr) => {
    const base = `/repos/${pr.owner}/${pr.repo}`;
    const repo = `${pr.owner}/${pr.repo}`;
    const found = [];
    const inline = (await get(`${base}/pulls/${pr.number}/comments?per_page=100`)) || [];
    for (const c of inline) {
      if (!same(c.user && c.user.login, who)) continue;
      found.push({ kind: 'inline', body: c.body || '', path: c.path || '', hunk: c.diff_hunk || '', url: c.html_url, repo, at: c.created_at });
    }
    const reviews = (await get(`${base}/pulls/${pr.number}/reviews?per_page=100`)) || [];
    for (const r of reviews) {
      if (!same(r.user && r.user.login, who) || !r.body) continue;
      found.push({ kind: 'review', body: r.body, path: '', hunk: '', url: r.html_url, repo, at: r.submitted_at, state: r.state });
    }
    const thread = (await get(`${base}/issues/${pr.number}/comments?per_page=100`)) || [];
    for (const c of thread) {
      if (!same(c.user && c.user.login, who)) continue;
      found.push({ kind: 'thread', body: c.body || '', path: '', hunk: '', url: c.html_url, repo, at: c.created_at });
    }
    onProgress(++done, list.length);
    return found;
  });

  return {
    user: { login: who, name: user.name || null, url: user.html_url },
    comments: results.flat(),
    prs: results.length,
    limited: Boolean(limited || hitLimit),
    resetAt: (limited || hitLimit || {}).resetAt || null,
  };
}

export function limitMessage(resetAt, token, now = Date.now()) {
  const mins = resetAt ? Math.max(1, Math.ceil((resetAt - now) / 60000)) : null;
  const when = mins ? ` Try again in ${mins} minute${mins === 1 ? '' : 's'}` : ' Try again later';
  return token ? `GitHub rate limit reached.${when}.` : `GitHub allows 60 requests an hour without a token and this hour's are used up.${when}, or run gh auth login.`;
}
