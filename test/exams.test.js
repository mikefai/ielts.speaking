const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const allocation = require('./allocation.js');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(f => /^exams-\d+\.js$/.test(f)).sort();
for (const f of files) require(path.join(dataDir, f));
const exams = globalThis.EXAMS ?? [];

const words = s => s.trim().split(/\s+/).length;
const norm = s => s.trim().toLowerCase().replace(/\s+/g, ' ');

test('exam data files are loaded', () => {
  assert.ok(files.length > 0 && exams.length > 0);
});

for (const e of exams) {
  test(`exam ${e.id} has the required shape`, () => {
    assert.ok(Number.isInteger(e.id) && e.id >= 1 && e.id <= 30);
    assert.equal(e.part1.length, 3);
    for (const t of e.part1) assert.equal(t.questions.length, 4);
    assert.equal(e.part2.bullets.length, 4);
    assert.ok(e.part2.bullets.every(b => typeof b === 'string' && b.trim() && !/[.?!]$/.test(b)));
    assert.ok(e.part2.bullets[3].startsWith('and '));
    assert.ok(e.part3.questions.length >= 5 && e.part3.questions.length <= 6);
  });

  test(`exam ${e.id} questions are well-formed`, () => {
    for (const q of e.part1.flatMap(t => t.questions)) assert.ok(q.endsWith('?') && words(q) <= 15, q);
    for (const q of e.part3.questions) assert.ok(q.endsWith('?') && words(q) <= 25, q);
  });

  test(`exam ${e.id} follows the allocation`, () => {
    const [frame, topic2, topic3, subject, theme] = allocation[e.id - 1];
    assert.deepEqual(e.part1.map(t => t.topic), [frame, topic2, topic3]);
    assert.equal(e.part2.prompt, `Describe ${subject}.`);
    assert.equal(e.part3.theme, theme);
  });
}

test('exam ids are unique', () => {
  const ids = exams.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('no question is repeated across or within exams', () => {
  const qs = exams.flatMap(e => [...e.part1.flatMap(t => t.questions), ...e.part3.questions]).map(norm);
  assert.deepEqual(qs.filter((q, i) => qs.indexOf(q) !== i), []);
});
