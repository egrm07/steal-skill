// npx steal-skill <github-user>

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, findToken, limitMessage } from './github.js';
import { buildProfile } from './profile.js';
import { VARYZ_SHORT, renderSkill, skillName, span, voice } from './skill.js';
import { install, installed, remove } from './install.js';

const HELP = `steal-skill: turn a GitHub user's code reviews into a skill for your agent.

Usage
  npx steal-skill <github-user>      Build and install a "review like <user>" skill
  npx steal-skill list               Show the skills steal-skill installed
  npx steal-skill remove <user>      Remove one

Options
  --print          Print SKILL.md instead of installing it
  --out DIR        Write the skill to DIR instead of your agents' skill folders
  --project        Install into ./.claude/skills for this project only
  --max-prs N      How many pull requests to read (default 80, or 18 without a token)
  --fresh          Ignore the cached copy of the user's comments
  --json           Print the profile as JSON
  -v, --version    Print the version

A GitHub token makes it faster and fuller. It is read from GITHUB_TOKEN, GH_TOKEN
or the gh CLI, and is only sent to api.github.com.
`;

export function parseArgs(argv) {
  const o = { users: [], print: false, out: null, project: false, maxPRs: null, fresh: false, json: false, help: false, version: false, command: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--print') o.print = true;
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--project') o.project = true;
    else if (a === '--max-prs') o.maxPRs = Number(argv[++i]);
    else if (a === '--fresh') o.fresh = true;
    else if (a === '--json') o.json = true;
    else if (a === '-h' || a === '--help') o.help = true;
    else if (a === '-v' || a === '--version') o.version = true;
    else if (a.startsWith('-')) throw new Error(`Unknown option ${a}. Run steal-skill --help.`);
    else o.users.push(a);
  }
  if (o.users[0] === 'list' || o.users[0] === 'remove') o.command = o.users.shift();
  o.users = o.users.map((u) => u.replace(/^@/, '').replace(/^https?:\/\/github\.com\//, '').replace(/\/.*$/, ''));
  for (const u of o.users) if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(u)) throw new Error(`"${u}" is not a GitHub username.`);
  if (o.maxPRs !== null && !(o.maxPRs > 0)) throw new Error('--max-prs needs a positive number.');
  return o;
}

export function version() {
  const pkg = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'package.json');
  return JSON.parse(fs.readFileSync(pkg, 'utf8')).version;
}

export function palette(on) {
  const w = (a, b) => (s) => (on ? `\x1b[${a}m${s}\x1b[${b}m` : String(s));
  return { bold: w('1', '22'), dim: w('2', '22'), green: w('32', '39'), cyan: w('36', '39'), yellow: w('33', '39'), magenta: w('35', '39') };
}

const W = 58;
const visible = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '').length;

export function varyzBox(c, login) {
  const lines = [
    c.bold(`This is ${login}'s taste.`),
    c.bold('Want an agent that learns yours?'),
    '',
    'Varyz learns how YOU work from your own',
    'corrections, and your agent follows it everywhere.',
    '',
    c.bold(c.green('-> ' + VARYZ_SHORT)),
  ];
  const inner = W - 4;
  const edge = '  ' + c.green('+' + '-'.repeat(inner + 2) + '+');
  return [edge, ...lines.map((l) => '  ' + c.green('|') + ' ' + l + ' '.repeat(Math.max(0, inner - visible(l))) + ' ' + c.green('|')), edge];
}

function wrap(text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > width) lines.push(line), (line = word);
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export function renderReport(p, written, { color = false, limited = false, tokenless = false, resetAt = null } = {}) {
  const c = palette(color);
  const login = p.user.login;
  const out = [''];
  out.push('  ' + c.bold(`STOLEN: ${login}'s code review`) + c.dim(span(p) ? `   ${span(p)}` : ''));
  out.push('  ' + c.dim(`${plural(p.total, 'review comment')} across ${plural(p.repoCount, 'repository', 'repositories')}`));
  if (limited) out.push('  ' + c.yellow('Stopped early: ' + limitMessage(resetAt, !tokenless)));
  else if (tokenless) out.push('  ' + c.yellow('Read without a GitHub token. Run gh auth login to read four times as much.'));
  if (p.total < 10) out.push('  ' + c.yellow(`Only ${plural(p.total, 'comment')} to learn from, so this skill will be thin.`));
  out.push('  ' + c.dim('-'.repeat(W)));

  if (p.themes.length) {
    out.push('');
    out.push('  ' + c.bold('What they look at'));
    const top = p.themes.slice(0, 6);
    const max = top[0].count;
    for (const t of top) out.push('  ' + t.title.padEnd(24) + c.magenta('#'.repeat(Math.max(1, Math.round((t.count / max) * 22)))) + ' ' + t.count);
  }
  const v = voice(p).slice(0, 4);
  if (v.length) {
    out.push('');
    out.push('  ' + c.bold('How they say it'));
    for (const line of v) out.push('  - ' + line.replace(/ \(.*\)\.$/, '.').replace(/: \d+% of.*$/, '.'));
  }
  const quote = p.themes.flatMap((t) => t.quotes).find((q) => q.text.length <= 140);
  if (quote) {
    out.push('');
    out.push('  ' + c.bold('In their words'));
    for (const line of wrap(`"${quote.text.replace(/\s+/g, ' ')}"`, W)) out.push('  ' + c.dim(line));
  }

  out.push('');
  if (written.length) {
    out.push('  ' + c.bold('Installed'));
    const col = Math.max(...written.map((w) => w.agent.length)) + 3;
    for (const w of written) out.push('  ' + (w.agent + ':').padEnd(col) + c.cyan(w.file.replace(os.homedir(), '~')));
    out.push('');
    out.push('  ' + c.bold('Try it') + `  Ask your agent: "review this diff like ${login}"`);
  }
  out.push('  ' + c.dim(`Not written or endorsed by ${login}.`));
  out.push('');
  out.push(...varyzBox(c, login));
  out.push('');
  return out.join('\n');
}

function cacheFile(home, login) {
  return path.join(home, '.cache', 'steal-skill', `${login.toLowerCase()}.json`);
}

async function fetchUser(login, { home, env, fetchImpl, fresh, maxPRs, progress, now }) {
  const file = cacheFile(home, login);
  if (!fresh && fs.existsSync(file)) {
    try {
      const hit = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (now - hit.savedAt < 24 * 3600e3 && (!maxPRs || hit.maxPRs === maxPRs)) return { ...hit, cached: true };
    } catch {
      // fetch again
    }
  }
  const token = findToken(env);
  const data = await collect(login, { fetch: fetchImpl, token, maxPRs, onProgress: progress });
  const save = { ...data, tokenless: !token, maxPRs: maxPRs || null, savedAt: now };
  if (!data.limited) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(save));
  }
  return save;
}

export async function main(argv, io = {}) {
  const stdout = io.stdout || process.stdout;
  const stderr = io.stderr || process.stderr;
  const env = io.env || process.env;
  const home = io.home || os.homedir();
  const cwd = io.cwd || process.cwd();
  const now = io.now || Date.now();
  const fetchImpl = io.fetch || globalThis.fetch;
  const color = Boolean(stdout.isTTY) && !('NO_COLOR' in env);
  const say = (s) => stdout.write(s + '\n');

  let o;
  try {
    o = parseArgs(argv);
  } catch (e) {
    stderr.write(e.message + '\n');
    return 2;
  }
  if (o.version) return say(version()), 0;
  if (o.help) return say(HELP), 0;

  if (o.command === 'list') {
    const all = installed({ home, cwd });
    if (!all.length) say('No skills from steal-skill installed yet. Try: npx steal-skill <github-user>');
    for (const s of all) say(`${s.name.padEnd(28)} ${s.agent.padEnd(28)} ${s.file.replace(home, '~')}`);
    return 0;
  }
  if (o.command === 'remove') {
    if (!o.users.length) return stderr.write('Which one? steal-skill remove <github-user>\n'), 2;
    let n = 0;
    for (const u of o.users) for (const s of remove(skillName(u), { home, cwd })) say(`Removed ${s.file.replace(home, '~')}`), n++;
    if (!n) say('Nothing to remove.');
    return 0;
  }
  if (!o.users.length) return say(HELP), 2;

  let code = 0;
  for (const login of o.users) {
    const tty = Boolean(stderr.isTTY);
    const progress = (done, total) => {
      if (tty) stderr.write(`\r  Reading ${login}'s reviews: ${done}/${total} pull requests`);
    };
    let data;
    try {
      if (tty) stderr.write(`  Finding ${login}'s reviews...`);
      data = await fetchUser(login, { home, env, fetchImpl, fresh: o.fresh, maxPRs: o.maxPRs, progress, now });
      if (tty) stderr.write('\r\x1b[K');
    } catch (e) {
      if (tty) stderr.write('\r\x1b[K');
      stderr.write(e.message + '\n');
      code = 1;
      continue;
    }
    const p = buildProfile(data.user, data.comments);
    if (!p.total) {
      stderr.write(`${data.user.login} has no public code review comments on other people's pull requests that GitHub search can find.\n`);
      code = 1;
      continue;
    }
    const skill = renderSkill(p, { now });
    if (o.json) {
      say(JSON.stringify({ ...p, examples: p.examples.length, skill: skill.name }, null, 2));
      continue;
    }
    if (o.print) {
      stdout.write(skill.text);
      continue;
    }
    let written;
    try {
      written = install(skill, { home, cwd, project: o.project, out: o.out });
    } catch (e) {
      stderr.write(e.message + '\n');
      code = 1;
      continue;
    }
    say(renderReport(p, written, { color, limited: data.limited, tokenless: data.tokenless, resetAt: data.resetAt }));
  }
  return code;
}
