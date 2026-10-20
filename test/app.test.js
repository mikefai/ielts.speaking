const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esc, fmt, loadDone, setDone, parseRoute, createTimer, renderList, renderExam } = require('../app.js');
require('../data/exams-1.js');
const exam1 = globalThis.EXAMS.find(e => e.id === 1);
const memory = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('esc escapes HTML-significant characters', () => {
  assert.equal(esc(`<b>"a" & 'b'</b>`), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
});

test('fmt formats seconds as m:ss', () => {
  assert.equal(fmt(0), '0:00');
  assert.equal(fmt(65), '1:05');
  assert.equal(fmt(120), '2:00');
});

test('loadDone survives missing, throwing and corrupt storage', () => {
  assert.deepEqual(loadDone(null), []);
  assert.deepEqual(loadDone({ getItem() { throw new Error('blocked'); } }), []);
  assert.deepEqual(loadDone({ getItem: () => '{oops' }), []);
  assert.deepEqual(loadDone({ getItem: () => '{"a":1}' }), []);
  assert.deepEqual(loadDone({ getItem: () => '[2,"x",5]' }), [2, 5]);
});

test('setDone adds, removes, de-duplicates and sorts', () => {
  const s = memory();
  assert.deepEqual(setDone(s, 3, true), [3]);
  assert.deepEqual(setDone(s, 3, true), [3]);
  assert.deepEqual(setDone(s, 1, true), [1, 3]);
  assert.deepEqual(setDone(s, 3, false), [1]);
  assert.deepEqual(loadDone(s), [1]);
});

test('setDone still returns the list when storage is unusable', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(setDone(blocked, 3, true), [3]);
  assert.deepEqual(setDone(null, 4, true), [4]);
});

test('parseRoute only accepts existing exams', () => {
  assert.deepEqual(parseRoute('#/exam/3', 30), { view: 'exam', id: 3 });
  for (const h of ['', '#/', '#/exam/0', '#/exam/31', '#/exam/abc', '#/exam/1.5', '#/exam/-2', '#/exam/3/x']) {
    assert.deepEqual(parseRoute(h, 30), { view: 'list' }, h);
  }
});

test('createTimer: restarting replaces the running countdown and it stops at 0', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const ticks = [];
  const timer = createTimer(n => ticks.push(n));
  timer.start(3);
  timer.start(3);
  assert.deepEqual(ticks, [3, 3]);
  t.mock.timers.tick(1000);
  assert.deepEqual(ticks, [3, 3, 2]);
  t.mock.timers.tick(1000);
  assert.deepEqual(ticks, [3, 3, 2, 1]);
  t.mock.timers.tick(1000);
  assert.deepEqual(ticks, [3, 3, 2, 1, 0]);
  t.mock.timers.tick(5000);
  assert.deepEqual(ticks, [3, 3, 2, 1, 0]);
});

test('createTimer.stop silences the countdown', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const ticks = [];
  const timer = createTimer(n => ticks.push(n));
  timer.start(5);
  timer.stop();
  t.mock.timers.tick(3000);
  assert.deepEqual(ticks, [5]);
});

test('createTimer.start(0) emits 0 once and starts no interval', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const ticks = [];
  createTimer(n => ticks.push(n)).start(0);
  t.mock.timers.tick(5000);
  assert.deepEqual(ticks, [0]);
});

test('createTimer follows the wall clock: a suspended page jumps to the right time', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const ticks = [];
  createTimer(n => ticks.push(n)).start(5);
  t.mock.timers.tick(4000); // one jump, as when a locked phone wakes up
  assert.deepEqual(ticks, [5, 1]);
});

test('renderList links every exam, shows the Part 2 prompt and marks done ones', () => {
  const exam2 = { ...exam1, id: 2, part2: { ...exam1.part2, prompt: 'Describe a quiet place.' } };
  const html = renderList([exam1, exam2], [2]);
  assert.match(html, /href="#\/exam\/1"/);
  assert.match(html, /href="#\/exam\/2"/);
  assert.match(html, /Describe a teacher who inspired you\./);
  assert.equal((html.match(/class="card done"/g) || []).length, 1);
  assert.match(html, /1 of 2 done/);
  assert.match(renderList([exam1], [99]), /0 of 1 done/);
});

test('renderExam shows all three parts, every question, the timer and the done box', () => {
  const html = renderExam(exam1, false, 30);
  for (const q of [...exam1.part1.flatMap(t => t.questions), ...exam1.part3.questions, ...exam1.part2.bullets]) {
    assert.ok(html.includes(esc(q)), q);
  }
  assert.match(html, /Part 1/);
  assert.match(html, /Part 2/);
  assert.match(html, /Part 3/);
  assert.match(html, /data-start="60"/);
  assert.match(html, /data-start="120"/);
  assert.match(html, /<output id="timer"/);
  assert.match(html, /data-done="1"/);
  assert.doesNotMatch(html, /checked/);
  assert.match(renderExam(exam1, true, 30), /checked/);
});

test('renderExam escapes content', () => {
  const html = renderExam({ ...exam1, part2: { ...exam1.part2, prompt: 'Describe Tom & Jerry <b>.' } }, false, 30);
  assert.ok(html.includes('Tom &amp; Jerry &lt;b&gt;.'));
  assert.ok(!html.includes('<b>'));
});

test('renderExam links previous/next only where an exam exists', () => {
  const first = renderExam({ ...exam1, id: 1 }, false, 30);
  assert.match(first, /href="#\/exam\/2"/);
  assert.doesNotMatch(first, /href="#\/exam\/0"/);
  const last = renderExam({ ...exam1, id: 30 }, false, 30);
  assert.match(last, /href="#\/exam\/29"/);
  assert.doesNotMatch(last, /href="#\/exam\/31"/);
});
