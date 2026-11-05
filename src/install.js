// Puts a skill where Claude Code and Codex look for skills, and lists or
// removes the ones steal-skill made.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MARK = 'by steal-skill (';

export function targets({ home = os.homedir(), cwd = process.cwd(), project = false, out = null } = {}) {
  if (out) return [{ agent: 'folder', dir: path.resolve(cwd, out) }];
  if (project) return [{ agent: 'Claude Code (this project)', dir: path.join(cwd, '.claude', 'skills') }];
  const list = [{ agent: 'Claude Code', dir: path.join(home, '.claude', 'skills') }];
  if (fs.existsSync(path.join(home, '.codex'))) list.push({ agent: 'Codex', dir: path.join(home, '.codex', 'skills') });
  return list;
}

export function install(skill, opts) {
  const written = [];
  for (const t of targets(opts)) {
    const dir = path.join(t.dir, skill.name);
    const file = path.join(dir, 'SKILL.md');
    if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes(MARK)) {
      throw new Error(`${file} already exists and was not made by steal-skill. Move it away or use --out.`);
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, skill.text, 'utf8');
    written.push({ agent: t.agent, file });
  }
  return written;
}

function ours(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith('steal-')) continue;
    const file = path.join(dir, name, 'SKILL.md');
    try {
      if (fs.readFileSync(file, 'utf8').includes(MARK)) out.push({ name, file });
    } catch {
      // not a skill folder
    }
  }
  return out;
}

export function installed(opts = {}) {
  const home = opts.home || os.homedir();
  const cwd = opts.cwd || process.cwd();
  const dirs = [
    { agent: 'Claude Code', dir: path.join(home, '.claude', 'skills') },
    { agent: 'Codex', dir: path.join(home, '.codex', 'skills') },
    { agent: 'Claude Code (this project)', dir: path.join(cwd, '.claude', 'skills') },
  ];
  return dirs.flatMap((d) => ours(d.dir).map((s) => ({ ...s, agent: d.agent })));
}

export function remove(name, opts = {}) {
  const gone = [];
  for (const s of installed(opts)) {
    if (s.name !== name) continue;
    fs.rmSync(path.dirname(s.file), { recursive: true, force: true });
    gone.push(s);
  }
  return gone;
}
