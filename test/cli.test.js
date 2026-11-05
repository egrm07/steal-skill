import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { main, parseArgs } from '../src/cli.js';
import { fakeGitHub, sink, tmpdir } from './helpers.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const run = async (argv, { home, cwd = home, gh = fakeGitHub(), env = { GITHUB_TOKEN: 'tok' } } = {}) => {
  const stdout = sink();
  const stderr = sink();
  const code = await main(argv, { stdout, stderr, env, home, cwd, fetch: gh.fetch, now: Date.UTC(2026, 10, 5) });
  return { code, out: stdout.text, err: stderr.text, gh };
};

test('parseArgs accepts @user and profile URLs', () => {
  assert.deepEqual(parseArgs(['@octo']).users, ['octo']);
  assert.deepEqual(parseArgs(['https://github.com/octo/repo']).users, ['octo']);
  assert.equal(parseArgs(['remove', 'octo']).command, 'remove');
  assert.throws(() => parseArgs(['not a user']), /not a GitHub username/);
  assert.throws(() => parseArgs(['--nope']), /Unknown option/);
});

test('installs for Claude Code and Codex and ends with the Varyz link', async () => {
  const home = tmpdir();
  fs.mkdirSync(path.join(home, '.codex'));
  const { code, out } = await run(['octoreviewer'], { home });
  assert.equal(code, 0);
  assert.ok(fs.existsSync(path.join(home, '.claude/skills/steal-octoreviewer/SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.codex/skills/steal-octoreviewer/SKILL.md')));
  assert.match(out, /STOLEN: octoreviewer's code review/);
  assert.match(out, /review this diff like octoreviewer/);
  assert.match(out, /Not written or endorsed by octoreviewer/);
  const tail = out.trimEnd().split('\n').slice(-9).join('\n');
  assert.match(tail, /Want an agent that learns yours\?/);
  assert.match(tail, /-> github\.com\/egrm07\/varyz/);
});

test('skips Codex when it is not installed', async () => {
  const home = tmpdir();
  await run(['octoreviewer'], { home });
  assert.ok(!fs.existsSync(path.join(home, '.codex')));
});

test('uses the cache on a second run', async () => {
  const home = tmpdir();
  await run(['octoreviewer'], { home });
  const again = await run(['octoreviewer'], { home });
  assert.equal(again.code, 0);
  assert.equal(again.gh.calls.length, 0);
});

test('--print writes the skill to stdout and installs nothing', async () => {
  const home = tmpdir();
  const { code, out } = await run(['octoreviewer', '--print'], { home });
  assert.equal(code, 0);
  assert.match(out, /^---\nname: steal-octoreviewer/);
  assert.ok(!fs.existsSync(path.join(home, '.claude')));
});

test('--project installs into the project only', async () => {
  const home = tmpdir();
  const cwd = tmpdir();
  await run(['octoreviewer', '--project'], { home, cwd });
  assert.ok(fs.existsSync(path.join(cwd, '.claude/skills/steal-octoreviewer/SKILL.md')));
  assert.ok(!fs.existsSync(path.join(home, '.claude/skills')));
});

test('never overwrites a skill it did not make', async () => {
  const home = tmpdir();
  const dir = path.join(home, '.claude/skills/steal-octoreviewer');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), 'mine');
  const { code, err } = await run(['octoreviewer'], { home });
  assert.equal(code, 1);
  assert.match(err, /was not made by steal-skill/);
  assert.equal(fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8'), 'mine');
});

test('list and remove', async () => {
  const home = tmpdir();
  await run(['octoreviewer'], { home });
  const listed = await run(['list'], { home });
  assert.match(listed.out, /steal-octoreviewer/);
  const removed = await run(['remove', 'octoreviewer'], { home });
  assert.match(removed.out, /Removed/);
  assert.ok(!fs.existsSync(path.join(home, '.claude/skills/steal-octoreviewer')));
});

test('an unknown user exits 1', async () => {
  const { code, err } = await run(['nobody-here', '--fresh'], { home: tmpdir() });
  assert.equal(code, 1);
  assert.match(err, /no GitHub user/);
});

test('no em dashes in shipped text', () => {
  const files = ['README.md', ...fs.readdirSync(path.join(ROOT, 'src')).map((f) => path.join('src', f))];
  for (const f of files) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) assert.ok(!fs.readFileSync(p, 'utf8').includes('—'), `${f} has an em dash`);
  }
});
