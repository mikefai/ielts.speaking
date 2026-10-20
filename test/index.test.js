const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]);

test('index.html loads the six data files then app.js as plain scripts', () => {
  assert.deepEqual(srcs, [1, 2, 3, 4, 5, 6].map(n => `data/exams-${n}.js`).concat('app.js'));
  assert.doesNotMatch(html, /type="module"|fetch\(/);
  assert.match(html, /<div id="app">/);
  assert.match(html, /<link[^>]+href="style\.css"/);
});

test('index.html carries the night-before tip', () => {
  assert.ok(html.includes('Night before the test? Pick 2–3 exams, answer out loud with a partner, then sleep.'));
});

test('every script and stylesheet index.html references exists', () => {
  for (const f of [...srcs, 'style.css']) assert.ok(fs.existsSync(path.join(__dirname, '..', f)), f);
});

test('app.js and the data files are classic scripts: no import/export lines', () => {
  const root = path.join(__dirname, '..');
  const files = ['app.js', ...fs.readdirSync(path.join(root, 'data')).filter(f => /^exams-\d+\.js$/.test(f)).map(f => `data/${f}`)];
  assert.ok(files.length >= 7);
  for (const f of files) {
    const bad = fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/).filter(l => /^\s*(import|export)\s/.test(l));
    assert.deepEqual(bad, [], f);
  }
});

test('index.html carries the whole night-before tip verbatim', () => {
  assert.ok(html.includes('Night before the test? Pick 2–3 exams, answer out loud with a partner, then sleep. Speaking is face-to-face with an examiner on test day, so typing answers does not count as practice.'));
});
