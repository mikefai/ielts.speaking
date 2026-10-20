const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const cards = html => (html.match(/class="card/g) || []).length;

// Runs the data files and app.js as classic scripts in a fresh vm context with a minimal stub DOM.
function boot({ skip = [], hash = '', storage = 'memory' } = {}) {
  const win = {}; // window-level listeners
  const clock = { now: 0 };
  const intervals = []; // callbacks passed to setInterval
  const cleared = [];
  const vibrations = [];
  const classes = new Set();
  const out = { textContent: '0:00', classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } };
  const app = { innerHTML: '', on: {}, addEventListener(type, fn) { this.on[type] = fn; } };
  const sandbox = {
    console,
    document: { title: '', getElementById: id => (id === 'app' ? app : id === 'timer' ? out : null) },
    location: { hash },
    navigator: { vibrate: ms => vibrations.push(ms) },
    setInterval: fn => intervals.push(fn),
    clearInterval: h => cleared.push(h),
    Date: { now: () => clock.now },
    scrollTo() {},
    addEventListener: (type, fn) => { win[type] = fn; },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const mem = new Map();
  Object.defineProperty(sandbox, 'localStorage', {
    get() {
      if (storage === 'throw') throw new Error('SecurityError');
      return { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
    },
  });
  vm.createContext(sandbox);
  const files = [1, 2, 3, 4, 5, 6].filter(n => !skip.includes(n)).map(n => `data/exams-${n}.js`).concat('app.js');
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
  const go = h => { sandbox.location.hash = h; win.hashchange(); };
  const click = seconds => app.on.click({ target: { closest: () => ({ dataset: { start: String(seconds) } }) } });
  return { app, out, classes, intervals, cleared, vibrations, clock, doc: sandbox.document, go, click };
}

test('with all data files the list shows 30 cards and 0 of 30 done', () => {
  const b = boot();
  assert.match(b.app.innerHTML, /0 of 30 done/);
  assert.equal(cards(b.app.innerHTML), 30);
  assert.doesNotMatch(b.app.innerHTML, /class="warn"/);
  assert.equal(b.doc.title, 'IELTS Speaking Mock Exams');
  b.go('#/exam/7');
  assert.match(b.app.innerHTML, /<h2>Exam 7<\/h2>/);
  assert.equal(b.doc.title, 'Exam 7 - IELTS Speaking Mock Exams');
  b.go('#/');
  assert.equal(b.doc.title, 'IELTS Speaking Mock Exams');
});

test('a throwing window.localStorage getter still renders the list and an exam', () => {
  const b = boot({ storage: 'throw' });
  assert.equal(cards(b.app.innerHTML), 30);
  b.go('#/exam/7');
  assert.match(b.app.innerHTML, /<h2>Exam 7<\/h2>/);
  b.app.on.change({ target: { matches: () => true, dataset: { done: '7' }, checked: true } }); // must not throw
});

test('with no data files the page says the exam data did not load', () => {
  const b = boot({ skip: [1, 2, 3, 4, 5, 6] });
  assert.match(b.app.innerHTML, /class="warn">Exam data did not load\./);
  assert.doesNotMatch(b.app.innerHTML, /class="grid"|of 0 done/);
  b.go('#/exam/1');
  assert.match(b.app.innerHTML, /Exam data did not load/);
});

test('with a data file missing the list warns, present exams open and missing ones fall back to the list', () => {
  const b = boot({ skip: [4] }); // exams 16-20
  assert.match(b.app.innerHTML, /class="warn">Only 25 of 30 exams loaded\./);
  assert.equal(cards(b.app.innerHTML), 25);
  b.go('#/exam/26');
  assert.match(b.app.innerHTML, /<h2>Exam 26<\/h2>/);
  b.go('#/exam/30');
  assert.match(b.app.innerHTML, /<h2>Exam 30<\/h2>/);
  b.go('#/exam/25');
  assert.match(b.app.innerHTML, /Exam 26 &rarr;/);
  b.go('#/exam/18');
  assert.doesNotMatch(b.app.innerHTML, /<h2>Exam 18<\/h2>/);
  assert.match(b.app.innerHTML, /class="grid"/);
});

test('a route change stops a running timer', () => {
  const b = boot({ hash: '#/exam/3' });
  b.click(60);
  assert.equal(b.intervals.length, 1);
  const stopsBefore = b.cleared.length;
  b.go('#/exam/4');
  assert.ok(b.cleared.length > stopsBefore);
});

test('the timer shows an end cue at 0:00 and clears it on restart', () => {
  const b = boot({ hash: '#/exam/3' });
  b.click(60);
  assert.equal(b.out.textContent, '1:00');
  assert.ok(!b.classes.has('up'));
  b.clock.now = 60000;
  b.intervals[0]();
  assert.equal(b.out.textContent, "Time's up");
  assert.ok(b.classes.has('up'));
  assert.deepEqual(b.vibrations, [300]);
  b.click(120);
  assert.equal(b.out.textContent, '2:00');
  assert.ok(!b.classes.has('up'));
});
