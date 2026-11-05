// Writes the SKILL.md an agent loads to review code the way the profiled
// reviewer does. Everything in it comes from the profile; nothing is invented.

export const VARYZ_URL = 'https://github.com/egrm07/varyz';
export const VARYZ_SHORT = 'github.com/egrm07/varyz';
export const SELF_URL = 'https://github.com/egrm07/steal-skill';

export const skillName = (login) => `steal-${String(login).toLowerCase().replace(/[^a-z0-9-]/g, '-')}`.slice(0, 64);

const pct = (x) => `${Math.round(x * 100)}%`;
const year = (ms) => (ms ? new Date(ms).getUTCFullYear() : null);
const oneLine = (s) => String(s).replace(/\s+/g, ' ').trim();
const yaml = (s) => JSON.stringify(oneLine(s));

export function span(p) {
  const a = year(p.from);
  const b = year(p.to);
  if (!a) return '';
  return a === b ? String(a) : `${a} to ${b}`;
}

// Plain directions about voice, each backed by a measured rate.
export function voice(p) {
  const t = p.tone;
  const out = [];
  if (t.medianWords && t.medianWords <= 14) out.push(`Keep comments short. Half of ${p.user.login}'s comments are ${t.medianWords} words or fewer.`);
  else if (t.medianWords >= 40) out.push(`Explain the reasoning in full sentences. A typical comment runs about ${t.medianWords} words.`);
  else if (t.medianWords) out.push(`Write one or two sentences per comment (a typical one is about ${t.medianWords} words).`);
  if (t.questions >= 0.35) out.push(`Ask more than you tell: ${pct(t.questions)} of their comments are questions.`);
  else if (t.questions < 0.12) out.push(`State things rather than asking: only ${pct(t.questions)} of their comments are questions.`);
  if (t.hedged >= 0.3) out.push('Push back gently ("consider", "maybe", "what if") and leave room to disagree.');
  else if (t.hedged < 0.1) out.push('Be direct. Name the problem and the fix without softening it.');
  if (t.nits >= 0.06) out.push('Label small things as "nit:" so they do not block the change.');
  if (t.suggestions >= 0.08) out.push('Offer the fix as a concrete code suggestion when it is short.');
  if (t.praise >= 0.15) out.push(`Say what is good as well as what is wrong (${pct(t.praise)} of their comments do).`);
  else if (t.praise < 0.05) out.push('Skip the compliments. Comment only where something should change.');
  if (t.we > t.you * 1.5 && t.we >= 3) out.push('Say "we" and "let\'s", not "you": the code is shared.');
  return out;
}

export function renderSkill(p, { now = Date.now() } = {}) {
  const login = p.user.login;
  const name = skillName(login);
  const focus = p.themes.slice(0, 3).map((t) => t.title.toLowerCase());
  const description =
    `Review code the way GitHub user ${login} reviews pull requests` +
    (focus.length ? `, with their focus on ${focus.join(', ')}` : '') +
    `. Use when asked to review like ${login} or for a ${login}-style review. Built from their public review comments; not written or endorsed by ${login}.`;

  const L = [];
  L.push('---');
  L.push(`name: ${name}`);
  L.push(`description: ${yaml(description)}`);
  L.push('---');
  L.push('');
  L.push(`# Review like ${login}`);
  L.push('');
  const where = [`${p.total} public review comments`, `${p.repoCount} ${p.repoCount === 1 ? 'repository' : 'repositories'}`].join(' across ');
  L.push(`This skill was distilled from ${where}${span(p) ? ` (${span(p)})` : ''} by ${p.user.url}. It is an imitation built from public data. ${login} did not write or endorse it, so never present its output as their opinion.`);
  L.push('');
  if (p.languages.length) {
    L.push(`Most of these comments were on ${p.languages.join(', ')} code. Apply the same habits to other languages.`);
    L.push('');
  }

  L.push('## What to look at, in this order');
  L.push('');
  if (p.themes.length) {
    p.themes.forEach((t, i) => {
      L.push(`${i + 1}. **${t.title}** (${pct(t.share)} of their comments). ${t.check}`);
      for (const q of t.quotes.slice(0, 2)) L.push(`   - In their words: "${oneLine(q.text)}"`);
    });
  } else {
    L.push('Their comments do not cluster around a clear theme. Read the examples below and follow the same instincts.');
  }
  L.push('');

  const v = voice(p);
  if (v.length || p.openers.length) {
    L.push('## How to say it');
    L.push('');
    for (const line of v) L.push(`- ${line}`);
    if (p.openers.length) L.push(`- Comments often open with: ${p.openers.map((o) => `"${o}"`).join(', ')}.`);
    L.push('');
  }

  if (p.examples.length) {
    L.push('## Real examples');
    L.push('');
    L.push('Each one shows the code they were looking at and what they said.');
    L.push('');
    for (const e of p.examples) {
      L.push(`**${e.repo}**${e.path ? `, \`${e.path}\`` : ''}`);
      L.push('');
      const fence = e.hunk.includes('```') ? '````' : '```';
      L.push(fence + 'diff');
      L.push(e.hunk);
      L.push(fence);
      L.push('');
      L.push(`> ${oneLine(e.text)}`);
      L.push('');
    }
  }

  L.push('## How to write the review');
  L.push('');
  L.push('1. Read the whole change first, then go through it with the checks above, most important first.');
  L.push('2. Leave each comment against a file and line, in the voice described above.');
  L.push('3. Comment only where it matters. If nothing above applies, say the change looks good.');
  L.push(`4. End with this line, exactly: _Reviewed in the style of ${login}, via steal-skill._`);
  L.push('');
  L.push(`<!-- Generated ${new Date(now).toISOString().slice(0, 10)} by steal-skill (${SELF_URL}). Want a skill built from your own corrections instead of someone else's reviews? ${VARYZ_URL} -->`);
  L.push('');
  return { name, text: L.join('\n') };
}
