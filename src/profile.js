// Distils review comments into a reviewer profile: what they look at,
// how they say it and the words they use. Plain counting, no model calls.

export const THEMES = [
  { key: 'correctness', title: 'Correctness', re: /\b(bugs?|wrong|incorrect|broken|breaks?|regressions?|doesn't work|does not work|won't work|mutat\w+|side effects?|off by one|race)\b/i, check: 'Trace what the code really does. Look for wrong results, mutation of shared data, and inputs that break it.' },
  { key: 'clarity', title: 'Clarity', re: /\b(confusing|unclear|readab\w+|hard to (follow|read|understand)|odd|weird|surprising|clearer|intent|factoring|feels)\b/i, check: 'Read it as a newcomer would. Flag anything confusing, surprising or oddly factored, and say how to make it clearer.' },
  { key: 'ux', title: 'User-facing behaviour', re: /\b(users?|ux|ui|screenshots?|accessib\w+|a11y|visual|behaviou?r|error messages?)\b/i, check: 'Think about what the person using it will see: behaviour, messages, accessibility. Ask how it was checked.' },
  { key: 'tests', title: 'Tests', re: /\b(tests?|testing|test case|coverage|asserts?|assertions?|specs?|fixtures?|mocks?|snapshot)\b/i, check: 'Look for missing or weak tests. Ask for a test that would fail without this change.' },
  { key: 'naming', title: 'Naming', re: /\b(names?|naming|named|rename[ds]?|renaming|call (it|this)|called)\b/i, check: 'Check every new name. Does it say what the thing is, and does it match the names around it?' },
  { key: 'errors', title: 'Errors and edge cases', re: /\b(errors?|exceptions?|throws?|raises?|panics?|handl(e|ed|ing)|fail(s|ed|ure)?|edge cases?|null|nil|undefined|retry|timeouts?)\b/i, check: 'Follow every failure path: bad input, a failed call, a missing value, a timeout.' },
  { key: 'simplicity', title: 'Simplicity', re: /\b(simplif\w*|simpler|unnecessary|redundant|duplicat\w*|dead code|not needed|overkill|too complex|complicated|inline this|just use|can be removed|remove this)\b/i, check: 'Look for code that could be smaller: duplication, needless abstraction, dead branches.' },
  { key: 'design', title: 'Design and structure', re: /\b(abstractions?|layers?|coupl\w+|responsibilit\w+|belongs?|architecture|design|refactor\w*|modules?|separation|ownership|dependency)\b/i, check: 'Question where the code lives and who owns it: layering, coupling, one job per unit.' },
  { key: 'api', title: 'API and compatibility', re: /\b(breaking|backwards?|compat\w*|deprecat\w+|public api|semver|migration|release notes)\b/i, check: 'Guard the public surface: breaking changes, backwards compatibility, deprecations.' },
  { key: 'docs', title: 'Docs and comments', re: /\b(comments?|docstrings?|docs|documentation|documented|readme|changelog|explain\w*|jsdoc|typos?)\b/i, check: 'Check that docs and comments match the change and explain why, not what.' },
  { key: 'performance', title: 'Performance', re: /\b(perf|performance|slow(er)?|allocat\w+|O\(n|complexity|memory|benchmarks?|expensive|latency|hot path|cach(e|ed|ing))\b/i, check: 'Watch for extra work in hot paths: repeated calls, allocations in loops, needless copies.' },
  { key: 'types', title: 'Types', re: /\b(types|typing|typed|typescript|type (check|error|signature|annotation)s?|casts?|generics?|nullable|annotations?|`any`)/i, check: 'Check types: precise signatures, no unsafe casts, missing values handled.' },
  { key: 'style', title: 'Consistency and style', re: /\b(style|formatting|lint\w*|consisten\w+|conventions?|indent\w*|whitespace|prettier|import order)\b/i, check: 'Keep it consistent with the codebase: conventions, formatting, file layout.' },
  { key: 'security', title: 'Security', re: /\b(secur\w+|auth\w*|tokens?|secrets?|passwords?|inject\w*|saniti[sz]\w*|escap\w+|xss|csrf|permissions?|vulnerab\w+)\b/i, check: 'Check input validation, auth, secrets, injection and unsafe defaults.' },
  { key: 'concurrency', title: 'Concurrency', re: /\b(races?|race condition|threads?|locks?|mutex|async|await|concurren\w+|deadlocks?|atomic|goroutines?|parallel)\b/i, check: 'Check shared state, races, locking, async ordering and cancellation.' },
  { key: 'scope', title: 'Scope', re: /\b(separate pr|follow-?up|out of scope|split (this|it)|unrelated|another pr|smaller pr)\b/i, check: 'Keep the change focused: split unrelated work and push back on scope creep.' },
];

const LANG = {
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', ts: 'TypeScript', tsx: 'TypeScript', py: 'Python', go: 'Go', rs: 'Rust',
  rb: 'Ruby', java: 'Java', kt: 'Kotlin', swift: 'Swift', c: 'C', h: 'C', cc: 'C++', cpp: 'C++', hpp: 'C++', cs: 'C#', php: 'PHP', scala: 'Scala',
  ex: 'Elixir', exs: 'Elixir', hs: 'Haskell', ml: 'OCaml', lua: 'Lua', dart: 'Dart', vue: 'Vue', svelte: 'Svelte', zig: 'Zig', sh: 'Shell',
  css: 'CSS', scss: 'CSS', md: 'Markdown', mdx: 'Markdown', sql: 'SQL', yml: 'YAML', yaml: 'YAML', toml: 'TOML', json: 'JSON',
};

// Turns raw markdown into the reviewer's own words.
export function clean(body) {
  let t = String(body || '').replace(/\r/g, '');
  const suggestion = /```suggestion\b[\s\S]*?```/.test(t);
  t = t
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*>.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/@([A-Za-z0-9-]+)/g, '$1') // never notify anyone
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return { text: t, suggestion };
}

const words = (t) => t.split(/\s+/).filter(Boolean);

const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

export function buildProfile(user, raw) {
  const seen = new Set();
  const comments = [];
  let tiny = 0;
  for (const c of raw) {
    const { text, suggestion } = clean(c.body);
    if (text.length < 15 && !suggestion) {
      if (text) tiny++;
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    comments.push({ ...c, text, suggestion });
  }
  const n = comments.length;
  const ratio = (f) => (n ? comments.filter(f).length / n : 0);

  const used = new Set();
  const themes = THEMES.map((th) => {
    const hits = comments.filter((c) => th.re.test(c.text));
    return { ...th, count: hits.length, share: n ? hits.length / n : 0, hits };
  })
    .filter((t) => t.count >= Math.max(2, Math.ceil(n * 0.05)))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .map(({ hits, ...t }) => ({ ...t, quotes: pickQuotes(hits, used) }));

  const tone = {
    questions: ratio((c) => /\?/.test(c.text)),
    nits: ratio((c) => /^\s*(nit|nitpick|minor)\b|\bnit:/i.test(c.text)),
    praise: ratio((c) => /\b(nice|great|love|lovely|thanks|thank you|good catch|lgtm|awesome|neat|clever|well done)\b/i.test(c.text)),
    suggestions: ratio((c) => c.suggestion),
    hedged: ratio((c) => /\b(maybe|perhaps|consider|could we|what if|i wonder|might|i think|not sure|wdyt)\b/i.test(c.text)),
    we: comments.filter((c) => /\b(we|let's|lets|us)\b/i.test(c.text)).length,
    you: comments.filter((c) => /\byou\b/i.test(c.text)).length,
    medianWords: median(comments.map((c) => words(c.text).length)),
    approvals: tiny,
  };

  const openerCount = new Map();
  for (const c of comments) {
    const w = words(c.text.toLowerCase().replace(/[^a-z0-9':\s?]/g, ' ')).slice(0, 2).join(' ').replace(/[?:]+$/, '');
    if (w.length < 3) continue;
    openerCount.set(w, (openerCount.get(w) || 0) + 1);
  }
  const openers = [...openerCount.entries()]
    .filter(([, k]) => k >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);

  const count = (arr) => {
    const m = new Map();
    for (const x of arr) if (x) m.set(x, (m.get(x) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const prose = new Set(['Markdown', 'JSON', 'YAML', 'TOML']);
  const languages = count(comments.map((c) => LANG[(c.path.split('.').pop() || '').toLowerCase()]))
    .filter(([l]) => !prose.has(l))
    .slice(0, 4)
    .map(([l]) => l);
  const repos = count(comments.map((c) => c.repo)).slice(0, 5).map(([r, k]) => ({ repo: r, count: k }));
  const dates = comments.map((c) => Date.parse(c.at)).filter(Number.isFinite);

  return {
    user,
    total: n,
    repoCount: new Set(comments.map((c) => c.repo)).size,
    from: dates.length ? Math.min(...dates) : null,
    to: dates.length ? Math.max(...dates) : null,
    themes,
    tone,
    openers,
    languages,
    repos,
    examples: pickExamples(comments),
  };
}

// Short, self-contained quotes from different repositories.
function pickQuotes(hits, used, k = 3) {
  const good = hits
    .filter((c) => c.text.length >= 30 && c.text.length <= 220 && !/\n/.test(c.text.trim()) && !/https?:\/\//.test(c.text) && !/:\s*$/.test(c.text) && !used.has(c.text))
    .sort((a, b) => Math.abs(a.text.length - 110) - Math.abs(b.text.length - 110));
  const out = [];
  const repos = new Set();
  for (const c of good) {
    if (out.length >= k) break;
    if (repos.has(c.repo) && good.length > k * 2) continue;
    repos.add(c.repo);
    used.add(c.text);
    out.push({ text: c.text, url: c.url, repo: c.repo });
  }
  return out;
}

// The longest thoughtful inline comments, one per repository first.
function pickExamples(comments, k = 6) {
  const pool = comments
    .filter((c) => c.kind === 'inline' && c.hunk && c.text.length >= 40 && c.text.length <= 420 && !/^\s*(thanks|thank you|lgtm)\b/i.test(c.text))
    .sort((a, b) => b.text.length - a.text.length);
  const out = [];
  const repos = new Set();
  for (const c of pool) if (out.length < k && !repos.has(c.repo)) out.push(c), repos.add(c.repo);
  for (const c of pool) if (out.length < k && !out.includes(c)) out.push(c);
  return out.map((c) => ({ text: c.text, url: c.url, repo: c.repo, path: c.path, hunk: c.hunk.split('\n').slice(-6).join('\n') }));
}
