// Builds the README images from a made-up reviewer, through the same code
// path a real run takes. No real person's reviews are used.
//   node scripts/demo.js

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { main } from '../src/cli.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ASSETS = path.join(ROOT, 'assets');
const LOGIN = 'the-reviewer';

const SAID = [
  ['src/cart.ts', '+  items.sort(byPrice)', '`sort` mutates the array we got from the store. Can we copy it first, or sort where the response is parsed?'],
  ['src/cart.ts', '+export function total(items) {', 'Can we add a test that fails without this change? Nothing covers the empty cart yet.'],
  ['src/api/client.ts', '+  const res = await fetch(url)', 'What happens when this times out? I think we should surface a clear error instead of returning undefined.'],
  ['src/api/client.ts', '+  retry(3)', 'nit: the retry count could be a named constant.'],
  ['lib/parse.py', '+def parse(s):', "Let's add tests for malformed input too. A test makes the error path real."],
  ['lib/parse.py', '+    except Exception:', 'This swallows every error, including bugs in our own code. Can we catch only the parse error?'],
  ['src/hooks/useUser.ts', '+  const [u, setU] = useState()', "The name `u` is confusing here. Maybe `user`? It also shadows the import."],
  ['src/hooks/useUser.ts', '+  useEffect(() => {', 'This feels oddly factored: the effect repeats the block above. Is there any benefit to keeping both?'],
  ['src/Button.tsx', '+  <div onClick={go}>', 'Could we use a real button here? Keyboard users cannot reach this one.'],
  ['src/Button.tsx', '+  color: "#999"', 'Would you mind adding before and after screenshots, and how we can check this?'],
  ['server/routes.go', '+	db.Query(q + id)', 'This builds SQL from user input. We need a parameterised query here.'],
  ['server/routes.go', '+	go worker()', 'Is there a race between this goroutine and the shutdown below? I think we need to wait for it.'],
  ['src/utils/format.ts', '+export const fmt = (n) =>', "We already have `formatMoney` in utils. Let's reuse it instead of adding a second one."],
  ['src/utils/format.ts', '+// format the number', 'The comment says what, not why. Either explain why we round here or drop it.'],
  ['README.md', '+## Install', 'This seems like a useful bit of information to add to the docs.'],
  ['src/store.ts', '+  state.items.push(item)', 'Mutating state here breaks the undo history. Can we return a new array?'],
  ['src/store.ts', '+export type Item = any', 'Can we give this a real type? `any` here hides the bug two lines below.'],
  ['test/cart.test.ts', '+  expect(total([])).toBe(0)', 'Nice, this is exactly the test I was hoping for. Thanks!'],
  ['src/api/client.ts', '+  if (!res) return', 'If the request fails we silently return. Can we log or throw so the caller knows?'],
  ['lib/parse.py', '+    return None', 'Returning None here pushes the error onto every caller. I think raising is clearer.'],
  ['server/routes.go', '+	if err != nil { return }', 'We drop the error here. Can we wrap it with the request id and return it?'],
  ['src/Modal.tsx', '+  <div className="modal">', 'Focus does not move into the modal, so screen reader users get lost. Can we trap focus?'],
  ['src/Modal.tsx', '+  onClose()', 'What does the user see if closing fails half way? Worth a test for that path.'],
  ['src/cart.ts', '+  if (qty > 0)', 'Is zero a valid quantity? This silently drops it, which looks like a bug to me.'],
  ['tools/cli.ts', '+  console.log(err)', 'The error message should say what to do next, not just print the stack.'],
  ['tools/cli.ts', '+  process.exit(1)', 'Can we add a test for the failure exit code? It is easy to break later.'],
  ['src/hooks/useCart.ts', '+  const c = useContext(Cart)', 'nit: `c` again. `cart` reads better and matches the other hooks.'],
  ['docs/api.md', '+Returns the total.', 'Can we document what happens with an empty cart? That is the case people will hit first.'],
];

function fakeGitHub() {
  const repos = ['shop/web', 'shop/api', 'tools/parser', 'shop/design', 'infra/server', 'shop/docs'];
  const prs = Array.from({ length: Math.ceil(SAID.length / 3) }, (_, i) => ({ repo: repos[i % repos.length], n: 100 + i }));
  const ok = (body) => ({ status: 200, ok: true, headers: { get: () => null }, json: async () => body });
  return async (url) => {
    const u = new URL(url);
    if (u.pathname === `/users/${LOGIN}`) return ok({ login: LOGIN, html_url: `https://github.com/${LOGIN}` });
    if (u.pathname === '/search/issues') return ok({ items: prs.map((p) => ({ html_url: `https://github.com/${p.repo}/pull/${p.n}` })) });
    const m = u.pathname.match(/^\/repos\/([^/]+\/[^/]+)\/pulls\/(\d+)\/comments$/);
    if (m) {
      const i = Number(m[2]) - 100;
      return ok(
        SAID.slice(i * 3, i * 3 + 3).map(([file, line, body], k) => {
          return { user: { login: LOGIN }, body, path: file, diff_hunk: `@@ -10,6 +10,7 @@\n   const x = load()\n${line}`, html_url: `https://github.com/${m[1]}/pull/${m[2]}#r${k}`, created_at: new Date(Date.UTC(2023 + (i % 4), i % 12, 3)).toISOString() };
        }),
      );
    }
    return ok([]);
  };
}

function findChrome() {
  const c = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  return c.find((p) => p && fs.existsSync(p));
}

function toPng(svg, file, width, height) {
  const chrome = findChrome();
  if (!chrome) throw new Error('Set CHROME_PATH to a Chrome or Chromium binary.');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'steal-skill-png-'));
  try {
    const page = path.join(tmp, 'p.html');
    fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#0e1013;overflow:hidden}svg{display:block}</style>${svg}`);
    execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${path.join(tmp, 'u')}`, '--force-device-scale-factor=2', `--window-size=${width},${height}`, `--screenshot=${file}`, 'file://' + page], { stdio: 'ignore', timeout: 45000 });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function windowSvg(lines, title, colorOf, w = 720) {
  const lh = 22;
  const h = 64 + lines.length * lh + 18;
  const body = lines
    .map((l, i) => {
      const y = 58 + i * lh;
      const bar = l.match(/^(\s*\S.*?\s{2,})(#+)( \d+)$/);
      if (bar) return `<text x="20" y="${y}" fill="#c9d1d9" xml:space="preserve">${esc(bar[1])}<tspan fill="#c792ea">${bar[2]}</tspan>${bar[3]}</text>`;
      const [fill, bold] = colorOf(l);
      return `<text x="20" y="${y}" fill="${fill}"${bold ? ' font-weight="700"' : ''} xml:space="preserve">${esc(l)}</text>`;
    })
    .join('\n');
  return {
    h,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>text{font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:14.5px}</style>
<rect width="${w}" height="${h}" rx="12" fill="#0e1013"/>
<circle cx="22" cy="20" r="6" fill="#ff5f57"/><circle cx="42" cy="20" r="6" fill="#febc2e"/><circle cx="62" cy="20" r="6" fill="#28c840"/>
<text x="${w / 2}" y="25" fill="#7d858e" text-anchor="middle" style="font-size:13px">${esc(title)}</text>
${body}
</svg>`,
  };
}

const terminalColor = (l) => {
  if (/STOLEN/.test(l)) return ['#ffffff', true];
  if (/^\s*[+|]/.test(l)) return ['#3fd98a', /Want an agent|taste\.|-> github/.test(l)];
  if (/^\s*(What they look at|How they say it|In their words|Installed|Try it)/.test(l)) return ['#ffffff', true];
  if (/^\s*(-{5,}|\d+ review|Not written)/.test(l) || /^\s*"/.test(l)) return ['#7d858e', false];
  if (/SKILL\.md/.test(l)) return ['#79c0ff', false];
  if (/^\s*"|^\s*[a-z].*"$/.test(l) && !/Try it/.test(l)) return ['#7d858e', false];
  return ['#c9d1d9', false];
};

const skillColor = (l) => {
  if (/^---|^name:|^description:/.test(l)) return ['#7d858e', false];
  if (/^#/.test(l)) return ['#ffffff', true];
  if (/^\d+\. /.test(l)) return ['#c9d1d9', false];
  if (/In their words/.test(l)) return ['#a5d6a7', false];
  return ['#c9d1d9', false];
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'steal-skill-demo-'));
try {
  let out = '';
  const stdout = { write: (s) => (out += s), isTTY: false };
  const stderr = { write: () => {}, isTTY: false };
  const code = await main([LOGIN, '--fresh'], { stdout, stderr, env: { GITHUB_TOKEN: 'demo' }, home: tmp, cwd: tmp, fetch: fakeGitHub(), now: Date.UTC(2026, 10, 5) });
  if (code !== 0) throw new Error('demo run failed');
  const shown = out.replace(tmp, '~').replace(/^(\s*Claude Code:\s+).*$/m, `$1~/.claude/skills/steal-${LOGIN}/SKILL.md`).replace(/\s+$/, '').split('\n');
  const term = windowSvg(shown, `~ npx steal-skill ${LOGIN}`, terminalColor);
  toPng(term.svg, path.join(ASSETS, 'terminal.png'), 720, term.h);

  const skill = fs.readFileSync(path.join(tmp, '.claude', 'skills', `steal-${LOGIN}`, 'SKILL.md'), 'utf8');
  const wrap = (s, n = 80) => {
    const lines = [];
    for (const raw of s.split('\n')) {
      let line = raw;
      const indent = (raw.match(/^(\s*(?:\d+\. |- )?)/) || [''])[0].replace(/\S/g, ' ');
      while (line.length > n) {
        const cut = line.lastIndexOf(' ', n);
        lines.push(line.slice(0, cut > 20 ? cut : n));
        line = indent + line.slice(cut > 20 ? cut + 1 : n);
      }
      lines.push(line);
    }
    return lines;
  };
  const head = skill.split('\n## How to say it')[0];
  const all = wrap(head.replace(/^description: .*$/m, 'description: "Review code the way GitHub user the-reviewer reviews pull..."'));
  const stop = all.findIndex((l, i) => i >= 26 && /^\d+\. /.test(l));
  const lines = all.slice(0, stop > 0 ? stop : 34);
  const sk = windowSvg(lines, `~/.claude/skills/steal-${LOGIN}/SKILL.md`, skillColor, 760);
  toPng(sk.svg, path.join(ASSETS, 'skill.png'), 760, sk.h);
  process.stdout.write(shown.join('\n') + '\n');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
