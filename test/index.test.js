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
