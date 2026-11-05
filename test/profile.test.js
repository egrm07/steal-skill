import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProfile, clean } from '../src/profile.js';
import { renderSkill, skillName, voice } from '../src/skill.js';
import { collect } from '../src/github.js';
import { fakeGitHub } from './helpers.js';

test('clean keeps the reviewer\'s own words and never keeps a mention', () => {
  const { text, suggestion } = clean('> quoted reply\n```suggestion\nx = 1\n```\nSee [the docs](https://x.y) and ask @alice <!-- hidden -->');
  assert.equal(suggestion, true);
  assert.equal(text, 'See the docs and ask alice');
  assert.ok(!text.includes('@'));
});

test('collect reads only the reviewer\'s comments', async () => {
  const gh = fakeGitHub();
  const data = await collect('OctoReviewer', { fetch: gh.fetch, token: 'tok' });
  assert.equal(data.user.login, 'octoreviewer');
  assert.equal(data.prs, 2);
  assert.ok(data.comments.every((c) => !c.body.includes('never appear')));
  assert.deepEqual(data.comments.map((c) => c.kind).sort(), ['inline', 'inline', 'inline', 'inline', 'inline', 'review', 'thread']);
  assert.ok(gh.calls.every((c) => c.auth));
});

test('without a token it stays inside the 60 requests GitHub allows', async () => {
  const gh = fakeGitHub({ prCount: 40 });
  const data = await collect('octoreviewer', { fetch: gh.fetch, token: null });
  assert.equal(data.prs, 18);
  assert.ok(gh.calls.length <= 60, `${gh.calls.length} requests`);
  assert.ok(gh.calls.every((c) => !c.auth));
});

test('a rate limit midway keeps what was read', async () => {
  const gh = fakeGitHub({ rateLimitAfter: 5 });
  const data = await collect('octoreviewer', { fetch: gh.fetch, token: null });
  assert.equal(data.limited, true);
  assert.ok(data.prs <= 1);
});

test('an unknown user is a clear error', async () => {
  const gh = fakeGitHub();
  await assert.rejects(collect('nobody-here', { fetch: gh.fetch }), /no GitHub user called nobody-here/);
});

test('profile ranks what the reviewer looks at and measures how they say it', async () => {
  const gh = fakeGitHub();
  const data = await collect('octoreviewer', { fetch: gh.fetch, token: 'tok' });
  const p = buildProfile(data.user, data.comments);
  assert.equal(p.total, 7);
  assert.equal(p.repoCount, 2);
  assert.equal(p.themes[0].key, 'tests');
  assert.ok(p.themes.some((t) => t.key === 'errors'));
  assert.deepEqual(p.languages.sort(), ['Python', 'TypeScript']);
  assert.ok(p.tone.questions > 0.3);
  assert.ok(p.tone.suggestions > 0);
  const quotes = p.themes.flatMap((t) => t.quotes.map((q) => q.text));
  assert.equal(new Set(quotes).size, quotes.length, 'a quote appears under one theme only');
  assert.ok(voice(p).length > 0);
});

test('the skill names the reviewer, says it is not endorsed, and signs reviews', async () => {
  const gh = fakeGitHub();
  const data = await collect('octoreviewer', { fetch: gh.fetch, token: 'tok' });
  const { name, text } = renderSkill(buildProfile(data.user, data.comments), { now: Date.UTC(2026, 10, 5) });
  assert.equal(name, 'steal-octoreviewer');
  assert.match(text, /^---\nname: steal-octoreviewer\ndescription: ".+"\n---\n/);
  assert.match(text, /not written or endorsed by octoreviewer/);
  assert.match(text, /did not write or endorse it/);
  assert.match(text, /_Reviewed in the style of octoreviewer, via steal-skill\._/);
  assert.match(text, /github\.com\/egrm07\/varyz/);
  assert.ok(!/@[a-z]/i.test(text.replace(/<!--[\s\S]*?-->/g, '')), 'no @mentions');
  assert.match(text, /```diff\n/);
});

test('skill names are safe folder names', () => {
  assert.equal(skillName('Some-User'), 'steal-some-user');
});
