import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const tmpdir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'steal-skill-test-'));

const res = (status, body, headers = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
  json: async () => body,
});

const REVIEWER = 'octoreviewer';

// Two pull requests. The reviewer leaves inline comments, a review body and
// a thread comment; someone else comments too and must be ignored.
export const COMMENTS = {
  'acme/widgets#1': [
    { user: { login: REVIEWER }, body: 'Can we add a test that fails without this change? Right now nothing covers the empty list case.', path: 'src/list.ts', diff_hunk: '@@ -1,3 +1,4 @@\n+export function first(xs) {\n+  return xs[0];\n+}', html_url: 'https://github.com/acme/widgets/pull/1#r1', created_at: '2025-03-01T10:00:00Z' },
    { user: { login: REVIEWER }, body: 'nit: this name is confusing, maybe `firstItem`? @someone what do you think', path: 'src/list.ts', diff_hunk: '@@ -5 +5 @@\n+const f = first(items)', html_url: 'https://github.com/acme/widgets/pull/1#r2', created_at: '2025-03-01T10:05:00Z' },
    { user: { login: 'bystander' }, body: 'I disagree with all of this and it should never appear in the skill', path: 'src/list.ts', diff_hunk: '@@', html_url: 'https://github.com/acme/widgets/pull/1#r3', created_at: '2025-03-01T11:00:00Z' },
  ],
  'acme/gears#7': [
    { user: { login: REVIEWER }, body: 'Does this handle the error when the file is missing? I think we should throw a clear error message here instead of returning undefined.', path: 'lib/read.py', diff_hunk: '@@ -10,2 +10,3 @@\n def read(p):\n+    return open(p).read()', html_url: 'https://github.com/acme/gears/pull/7#r9', created_at: '2026-01-10T09:00:00Z' },
    { user: { login: REVIEWER }, body: '```suggestion\nreturn path.read_text()\n```\nWe can simplify this, the helper is unnecessary.', path: 'lib/read.py', diff_hunk: '@@ -20 +20 @@\n+    return helper(p)', html_url: 'https://github.com/acme/gears/pull/7#r10', created_at: '2026-01-10T09:02:00Z' },
    { user: { login: REVIEWER }, body: 'Could we add tests for the missing file case too? A test makes the error path real.', path: 'lib/read.py', diff_hunk: '@@ -30 +30 @@\n+    pass', html_url: 'https://github.com/acme/gears/pull/7#r11', created_at: '2026-01-10T09:03:00Z' },
  ],
};

export function fakeGitHub({ rateLimitAfter = Infinity, prCount = 0, users = { [REVIEWER]: { login: REVIEWER, name: 'Octo Reviewer', html_url: `https://github.com/${REVIEWER}` } } } = {}) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, auth: Boolean(opts.headers.Authorization) });
    if (calls.length > rateLimitAfter) return res(403, { message: 'rate limit' }, { 'x-ratelimit-remaining': '0' });
    const u = new URL(url);
    let m;
    if ((m = u.pathname.match(/^\/users\/([^/]+)$/))) {
      const found = Object.values(users).find((x) => x.login.toLowerCase() === decodeURIComponent(m[1]).toLowerCase());
      return found ? res(200, found) : res(404, {});
    }
    if (u.pathname === '/search/issues') {
      const extra = Array.from({ length: prCount }, (_, i) => ({ html_url: `https://github.com/acme/more/pull/${100 + i}`, title: 'More' }));
      return res(200, { items: [{ html_url: 'https://github.com/acme/widgets/pull/1', title: 'Add first()' }, { html_url: 'https://github.com/acme/gears/pull/7', title: 'Read files' }, ...extra] });
    }
    if ((m = u.pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)\/comments$/))) return res(200, COMMENTS[`${m[1]}/${m[2]}#${m[3]}`] || []);
    if ((m = u.pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)\/reviews$/))) {
      if (m[2] !== 'widgets') return res(200, []);
      return res(200, [{ user: { login: REVIEWER }, body: 'Looks good overall, thanks! Please add tests before we merge.', html_url: 'https://github.com/acme/widgets/pull/1#review-1', submitted_at: '2025-03-01T12:00:00Z', state: 'CHANGES_REQUESTED' }]);
    }
    if ((m = u.pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/issues\/(\d+)\/comments$/))) {
      if (m[2] !== 'gears') return res(200, []);
      return res(200, [{ user: { login: REVIEWER }, body: 'Let us keep this focused and do the rename in a separate PR.', html_url: 'https://github.com/acme/gears/pull/7#issuecomment-5', created_at: '2026-01-11T09:00:00Z' }]);
    }
    return res(404, {});
  };
  return { fetch, calls, login: REVIEWER };
}

export function sink(isTTY = false) {
  let out = '';
  return { write: (s) => (out += s), isTTY, get text() { return out; } };
}
