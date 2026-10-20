# IELTS Speaking Mock Exams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static webpage holding 30 complete IELTS Academic Speaking mock exams (Part 1, Part 2 cue card, Part 3) that a candidate can open the night before the test and speak through.

**Architecture:** No build step, no dependencies. Exam content lives in six plain-script data files (5 exams each) that push onto `globalThis.EXAMS`; `app.js` holds pure render/logic functions (unit-tested in Node via CommonJS export) plus a small browser bootstrap (hash routing, Part 2 timer, "done" checkboxes in `localStorage`). A single allocation table in `test/allocation.js` fixes every exam's topics so parallel content tasks cannot collide, and the tests enforce it.

**Tech Stack:** HTML, CSS, vanilla JS (classic `<script>` tags so it opens from `file://`), Node 24 built-in `node:test` for tests.

**Spec:** none beyond the request, quoted here: *"build a webpage with IELTS Academic speaking questions covering part 1, part 2, and part 3 with 30 full exams that an examiner must answer one night before the exam. use cheaper models to implement the plan."* Read "examiner must answer" as **examinee** (the candidate practising). Format facts come from the `ielts-academic-instructor` skill (`references/speaking.md`, `references/exam-authenticity.md` §E).

## Global Constraints

- Static site: no build tools, no npm dependencies, no `type="module"`, no `fetch` — it must work by double-clicking `index.html` (`file://`).
- Tests: `npm test` runs `node --test test/*.test.js` (Node ≥ 20; this machine has v24.20.0).
- Exam object shape (exact):
  `{ id: number 1..30, part1: [{ topic: string, questions: string[4] } ×3], part2: { prompt: string, bullets: string[4] }, part3: { theme: string, questions: string[5..6] } }`
- Part 2 `prompt` is exactly `Describe <subject>.` (subject from `test/allocation.js`); `bullets[3]` starts with `and ` (the "and explain …" line); bullets carry no trailing full stop.
- Every question ends with `?`. Part 1 questions ≤ 15 words; Part 3 questions ≤ 25 words. Questions are unique across the whole set (case-insensitive).
- Part 1: personal, concrete, answerable in 2–3 sentences; never assume marriage, children, a car or overseas travel. Part 3: abstract/societal and idea-based ("Do you think…", "Why do…", "How has … changed…"), ordered easiest → hardest, never "tell me about a time…".
- Difficulty target: a Band 5.5 candidate can attempt every question; a Band 7.5 candidate can show range on it.
- British spelling; natural spoken English a real examiner would say; no brand names; avoid religion, politics, death, crime and other sensitive topics.
- Part 2 timer buttons: `data-start="60"` (1-minute preparation) and `data-start="120"` (up to 2-minute talk).
- Page copy to include verbatim (index.html): `Night before the test? Pick 2–3 exams, answer out loud with a partner, then sleep. Speaking is face-to-face with an examiner on test day, so typing answers does not count as practice.`
- Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Commands run from the project root (`C:\Users\MIKE\OneDrive\Desktop\ielts speaking`).

## Review Focus

Failure modes the request implies but the happy-path tests would miss, most likely first. Each is pinned by a test in the named task.

1. Page opened by double-clicking `index.html` on a phone, no server — scripts must be classic and in order, no modules/`fetch` (Task 3 `test/index.test.js`; Task 9 browser check).
2. `localStorage` blocked, throwing, or holding corrupt JSON — list and exam must still render and the checkbox must not throw (Task 2 `loadDone` / `setDone` tests).
3. Stale or hand-typed hash (`#/exam/99`, `#/exam/abc`, empty) — show the list, never a blank page (Task 2 `parseRoute` test).
4. Tapping a timer button twice, or leaving the exam while it runs — exactly one countdown, none leaking into the next view (Task 2 `createTimer` test; Task 3 calls `timer.stop()` on every route change).
5. Exam 1 has no dead "previous" link and exam 30 no dead "next" link (Task 2 `renderExam` test).

## Execution Notes

- **Models:** implementers run on `haiku` (cheaper than this session). Tasks 1–3 and 4–8 are specified down to signatures/assertions so a small model can follow them. Task 1 ends with a content-quality gate: if exams 2–5 are weak, re-run Tasks 4–8 on `sonnet` instead. Task 9 is done by the controller (this session).
- **Order:** run Tasks 1 → 9 in order. Tasks 4–8 touch disjoint files but share one git repo, so run them one at a time.
- **Out of scope (YAGNI):** model answers, audio recording or AI scoring (Speaking is human-marked), accounts/backend, search/filters, examiner "rounding-off" questions, offline caching (it already runs from disk).

## File Structure

- `index.html` — shell: heading, night-before tip, `<div id="app">`, script tags (six data files, then `app.js`).
- `style.css` — mobile-first layout, dark mode, print rules.
- `app.js` — pure functions (`esc`, `fmt`, `loadDone`, `setDone`, `parseRoute`, `createTimer`, `renderList`, `renderExam`) exported via CommonJS for tests, plus a browser-only bootstrap.
- `data/exams-1.js` … `data/exams-6.js` — exams 1–5, 6–10, …, 26–30.
- `test/allocation.js` — topic allocation table (single source of truth).
- `test/exams.test.js`, `test/app.test.js`, `test/index.test.js` — contract tests.
- `package.json` — `npm test` script only.

---

### Task 1: Test harness, allocation table, exams 1–5

**Implementer model:** haiku

**Files:**
- Create: `package.json`, `test/allocation.js`, `test/exams.test.js`, `data/exams-1.js`

**Interfaces:**
- Produces: `globalThis.EXAMS` — array of exam objects (shape in Global Constraints), appended to by every `data/exams-N.js`. `test/allocation.js` exports `string[30][5]`: `[frameTopic, part1Topic2, part1Topic3, part2Subject, part3Theme]`, index = `id - 1`.

- [ ] **Step 1: Initialise and write the failing test**

Run `git init`. Create `package.json`:
```json
{ "name": "ielts-speaking", "private": true, "scripts": { "test": "node --test test/*.test.js" } }
```
Create `test/allocation.js` with exactly:
```js
// [part 1 topic 1 (frame), part 1 topic 2, part 1 topic 3, part 2 "Describe <subject>.", part 3 theme] per exam id 1..30
module.exports = [
  ['Hometown', 'Daily routine', 'Family', 'a teacher who inspired you', 'Education and role models'],
  ['Work or Study', 'Weather', 'Music', 'a historic place you visited', 'Heritage and tourism'],
  ['Home', 'Hobbies', 'Sleep', 'a piece of technology you find useful', 'Technology and daily life'],
  ['Hometown', 'Colours', 'Birthdays', 'a time you helped someone', 'Helping others and volunteering'],
  ['Work or Study', 'Flowers', 'Photographs', 'a book you enjoyed reading', 'Reading and literature'],
  ['Home', 'Sleep', 'Colours', 'a memorable meal', 'Food and eating habits'],
  ['Hometown', 'Birthdays', 'Flowers', 'a quiet place you like to spend time in', 'Noise and relaxation'],
  ['Work or Study', 'Photographs', 'Handwriting', 'a sport or exercise you enjoy', 'Sport and fitness'],
  ['Home', 'Holidays', 'Art', 'a time you were late', 'Punctuality and time management'],
  ['Hometown', 'Weekends', 'Walking', 'a skill you would like to learn', 'Learning and skills'],
  ['Work or Study', 'Handwriting', 'Holidays', 'a friend you have known for a long time', 'Friendship'],
  ['Home', 'Art', 'Weekends', 'a piece of clothing you like wearing', 'Fashion and dress'],
  ['Hometown', 'Walking', 'Chocolate', 'a family celebration', 'Celebrations and traditions'],
  ['Work or Study', 'Umbrellas', 'Patience', 'a job you admire', 'Careers and work'],
  ['Home', 'Laughing', 'Dreams', 'a film you enjoyed', 'Cinema and entertainment'],
  ['Hometown', 'Chocolate', 'Umbrellas', 'a journey you made by public transport', 'Transport'],
  ['Work or Study', 'Patience', 'Laughing', 'a gift you gave to someone', 'Gifts and generosity'],
  ['Home', 'Dreams', 'Crowded places', 'a neighbour', 'Neighbourhoods and community'],
  ['Hometown', 'Trees', 'Advertisements', 'a building you like', 'Architecture and cities'],
  ['Work or Study', 'Keys', 'Bags', 'a time you were very busy', 'Stress and work-life balance'],
  ['Home', 'Crowded places', 'Trees', 'an app or website you use often', 'The internet and social media'],
  ['Hometown', 'Advertisements', 'Keys', 'a museum or gallery you visited', 'Museums and culture'],
  ['Work or Study', 'Bags', 'Shoes', 'a news story you read or heard', 'News and media'],
  ['Home', 'Stars', 'Mirrors', 'a time you tried something new', 'Change and taking risks'],
  ['Hometown', 'Dictionaries', 'Evenings', 'an object that is important to you', 'Possessions and materialism'],
  ['Work or Study', 'Shoes', 'Stars', 'a famous person you admire', 'Fame and celebrity'],
  ['Home', 'Mirrors', 'Dictionaries', 'a time you spent a lot of money on something', 'Money and spending'],
  ['Hometown', 'Evenings', 'Daily routine', 'an animal you like', 'Animals and the environment'],
  ['Work or Study', 'Family', 'Weather', 'a decision you made after careful thought', 'Decision-making'],
  ['Home', 'Music', 'Hobbies', 'a park or garden you like', 'Green spaces in cities'],
];
```
Create `test/exams.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `ENOENT … data` (no `data/` directory yet).

- [ ] **Step 3: Create `data/exams-1.js` with exams 1–5**

File form: `(globalThis.EXAMS ??= []).push( {exam}, {exam}, … );` — five exam objects in one `push` call. Exam 1 is fixed below and doubles as the style benchmark. Write exams 2–5 in the same shape from allocation rows 2–5 and the Global Constraints.
```js
{
  id: 1,
  part1: [
    { topic: 'Hometown', questions: [
      'Where is your hometown?',
      'What do you like most about your hometown?',
      'Has your hometown changed much since you were a child?',
      'Would you recommend your hometown to visitors?',
    ] },
    { topic: 'Daily routine', questions: [
      'What time do you usually get up on weekdays?',
      'Is there a part of your day that you particularly enjoy?',
      'Do you prefer to follow a fixed routine or do things as they come?',
      'Has your daily routine changed in the last few years?',
    ] },
    { topic: 'Family', questions: [
      'How many people are there in your family?',
      'Who in your family are you closest to?',
      'Do you and your family often eat meals together?',
      'What do you enjoy doing with your family at weekends?',
    ] },
  ],
  part2: {
    prompt: 'Describe a teacher who inspired you.',
    bullets: [
      'who the teacher was',
      'when and where you were taught by them',
      'what made their lessons different from others',
      'and explain why this teacher inspired you',
    ],
  },
  part3: {
    theme: 'Education and role models',
    questions: [
      'What qualities do you think make a good teacher?',
      'Do you think students learn better in small classes or in large ones?',
      'How has the role of teachers changed over the last few decades?',
      'Who do young people look up to nowadays, and is that a good thing?',
      'Some people say schools should teach children how to behave as well as academic subjects. What is your view?',
    ],
  },
},
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — output lists `exam 1 follows the allocation` … `exam 5 follows the allocation` and ends with `# fail 0`. If `no question is repeated` fails, reword the named duplicate.

- [ ] **Step 5: Quality gate (controller, not delegated)**

Read exams 2–5. Each must pass: Part 1 questions are personal and plain; Part 3 questions are idea-based and get harder; nothing sensitive; wording reads like an examiner speaking. If more than one exam fails, re-dispatch Tasks 4–8 on `sonnet` and redo exams 2–5 on `sonnet`.

- [ ] **Step 6: Commit**

```bash
git add package.json test data
git commit -m "feat: exam contract tests, topic allocation, exams 1-5"
```

---

### Task 2: Pure app logic and renderers

**Implementer model:** haiku

**Files:**
- Create: `app.js`, `test/app.test.js`

**Interfaces:**
- Consumes: exam objects from `data/exams-1.js` (Task 1).
- Produces (all exported via `module.exports` when `typeof module !== 'undefined'`; also usable as globals in the browser):
  - `esc(s: string): string` — escapes `& < > " '` as `&amp; &lt; &gt; &quot; &#39;`
  - `fmt(seconds: number): string` — `m:ss`
  - `loadDone(storage: Storage | null): number[]` — `[]` on any failure; keeps only integers
  - `setDone(storage: Storage | null, id: number, isDone: boolean): number[]` — returns the new sorted, de-duplicated list; persists under key `ielts-speaking-done`; never throws
  - `parseRoute(hash: string, total: number): { view: 'list' } | { view: 'exam', id: number }`
  - `createTimer(onTick: (secondsLeft: number) => void): { start(seconds: number): void, stop(): void }`
  - `renderList(exams: Exam[], doneIds: number[]): string`
  - `renderExam(exam: Exam, isDone: boolean, total: number): string`

- [ ] **Step 1: Write the failing tests** in `test/app.test.js`

```js
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
  t.mock.timers.enable({ apis: ['setInterval'] });
  const ticks = [];
  const timer = createTimer(n => ticks.push(n));
  timer.start(3);
  timer.start(3);
  assert.deepEqual(ticks, [3, 3]);
  t.mock.timers.tick(1000);
  assert.deepEqual(ticks, [3, 3, 2]);
  t.mock.timers.tick(2000);
  assert.deepEqual(ticks, [3, 3, 2, 1, 0]);
  t.mock.timers.tick(5000);
  assert.deepEqual(ticks, [3, 3, 2, 1, 0]);
});

test('createTimer.stop silences the countdown', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const ticks = [];
  const timer = createTimer(n => ticks.push(n));
  timer.start(5);
  timer.stop();
  t.mock.timers.tick(3000);
  assert.deepEqual(ticks, [5]);
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
  assert.match(html, /<output id="timer">/);
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test test/app.test.js`
Expected: FAIL — `Cannot find module '../app.js'`.

- [ ] **Step 3: Implement the functions in `app.js`** (signatures in Interfaces above)

- `esc`, `fmt`, `loadDone`, `setDone`, `parseRoute` — straightforward; `loadDone`/`setDone` wrap every storage access in `try/catch`; `parseRoute` matches `/^#\/exam\/(\d+)$/` and requires `1 <= id <= total`.
- `createTimer`: look up `setInterval`/`clearInterval` at call time (not captured at load, so mocked timers work). `start` calls `stop()`, calls `onTick(seconds)` immediately, then ticks every 1000 ms, and stops itself after calling `onTick(0)`.
- `renderList`: `<p class="progress">N of M done</p>` (N counts only ids present in `exams`) then `<ul class="grid">` of `<li><a class="card" href="#/exam/ID">` with `<strong>Exam ID</strong>` and the escaped Part 2 prompt; done exams use `class="card done"`.
- `renderExam`: `<nav class="nav">` (link to `#/`, previous/next `#/exam/N±1` only when in range), `<h2>Exam ID</h2>`, one `<section>` per part with headings "Part 1: Interview (4-5 min)", "Part 2: Long turn (1 min to prepare, up to 2 min to speak)", "Part 3: Discussion (4-5 min)"; Part 1 groups questions under an `<h4>` per topic in an `<ol>`; Part 2 shows `<div class="cue">` (the prompt, "You should say:", the bullets), then `<div class="timer">` with `<button data-start="60">Start 1-minute preparation</button> <button data-start="120">Start 2-minute talk</button> <output id="timer">0:00</output>`; Part 3 shows the theme and an `<ol>`; last is `<label class="done-toggle"><input type="checkbox" data-done="ID"[ checked]> Mark exam as done</label>`. Every piece of exam text goes through `esc`.
- End of file: `if (typeof module !== 'undefined') module.exports = { esc, fmt, loadDone, setDone, parseRoute, createTimer, renderList, renderExam };`

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add app.js test/app.test.js
git commit -m "feat: pure render and logic functions with tests"
```

---

### Task 3: Page shell, styling and browser wiring

**Implementer model:** haiku

**Files:**
- Create: `index.html`, `style.css`, `test/index.test.js`
- Modify: `app.js` (append the browser bootstrap)

**Interfaces:**
- Consumes: everything exported by Task 2; `globalThis.EXAMS` from the data files.
- Produces: the working page. DOM contract: `#app` container; `#timer` output; `[data-start]` buttons; `[data-done]` checkbox.

- [ ] **Step 1: Write the failing test** in `test/index.test.js`

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/index.test.js`
Expected: FAIL — `ENOENT … index.html`.

- [ ] **Step 3: Create `index.html`**

`<!doctype html>`, `<meta charset="utf-8">`, viewport meta, `<title>IELTS Speaking Mock Exams</title>`, `<link rel="stylesheet" href="style.css">`; body: `<h1>IELTS Academic Speaking: 30 Mock Exams</h1>`, `<p class="tip">` with the verbatim tip from Global Constraints, `<div id="app"></div>`, `<noscript>This page needs JavaScript.</noscript>`, then the seven script tags in the order the test expects.

- [ ] **Step 4: Create `style.css`**

Mobile-first, one column, `max-width: 44rem`, centred, 16px side gutters, system font stack, 18px body text, no horizontal scroll at 375px. CSS custom properties on `:root` for `--bg --fg --muted --accent --border`; override them in `@media (prefers-color-scheme: dark)` (people use this at night). `.grid` is 2 columns, 3 from 600px; `.card` is a bordered block with `min-height: 4rem`; `.card.done::after { content: "✓ done" }`; `.cue` styling for the Part 2 cue-card block (bordered, slightly raised); `output` large and monospace. `@media print` hides `.nav`, `.timer`, `.done-toggle`.

- [ ] **Step 5: Append the browser bootstrap to `app.js`**, guarded by `if (typeof document !== 'undefined') { … }`

- `exams = (globalThis.EXAMS || []).slice().sort((a, b) => a.id - b.id)`; `store()` returns `window.localStorage` inside `try/catch`, else `null`.
- `timer = createTimer(n => { const out = document.getElementById('timer'); if (out) out.textContent = fmt(n); })`.
- `show()`: `timer.stop()`; `parseRoute(location.hash, exams.length)`; for an exam route find the exam with `exams.find(e => e.id === id)` and render `renderExam(exam, loadDone(store()).includes(id), exams.length)`, otherwise render `renderList(exams, loadDone(store()))`; then `window.scrollTo(0, 0)`.
- Listeners on `#app`: `click` → if `e.target.closest('[data-start]')` call `timer.start(Number(button.dataset.start))`; `change` → if `e.target.matches('[data-done]')` call `setDone(store(), Number(e.target.dataset.done), e.target.checked)`. `window.addEventListener('hashchange', show); show();`

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, `# fail 0`.

- [ ] **Step 7: Browser smoke check (controller, not delegated)**

Open `file:///C:/Users/MIKE/OneDrive/Desktop/ielts%20speaking/index.html` in the built-in browser. Expected: heading and tip visible; "0 of 5 done" with 5 cards (exams 1–5 exist so far); opening Exam 1 shows three parts; clicking "Start 1-minute preparation" counts `1:00 → 0:59`; ticking the box and returning to the list shows "1 of 5 done"; no console errors other than failed loads of `data/exams-2.js` … `exams-6.js` (those arrive in Tasks 4–8).

- [ ] **Step 8: Commit**

```bash
git add index.html style.css app.js test/index.test.js
git commit -m "feat: page shell, styling and browser wiring"
```

---

### Tasks 4–8: Content batches 2–6

**Implementer model:** haiku (switch to sonnet if the Task 1 quality gate said so)

Five identical tasks; only the file and exam range differ.

| Task | Create | Exams (allocation rows) |
|---|---|---|
| 4 | `data/exams-2.js` | 6–10 |
| 5 | `data/exams-3.js` | 11–15 |
| 6 | `data/exams-4.js` | 16–20 |
| 7 | `data/exams-5.js` | 21–25 |
| 8 | `data/exams-6.js` | 26–30 |

**Interfaces:**
- Consumes: the exam shape and the style benchmark (exam 1) in `data/exams-1.js`; the rows of `test/allocation.js`.
- Produces: five more exams on `globalThis.EXAMS`.

- [ ] **Step 1: Read `data/exams-1.js` (shape and tone) and the five allocation rows for this batch.**

- [ ] **Step 2: Create the data file** in the same form as `data/exams-1.js`: `(globalThis.EXAMS ??= []).push( …five exam objects… );`. For each exam, Part 1 topic names, the Part 2 prompt and the Part 3 theme come exactly from its allocation row; write 4 questions per Part 1 topic, 4 bullets, and 5–6 Part 3 questions under the Global Constraints. Questions must not duplicate any in the existing data files (search them before reusing a phrasing).

- [ ] **Step 3: Run the tests**

Run: `npm test`
Expected: PASS, `# fail 0`, and the output contains `exam <first id> follows the allocation` … `exam <last id> follows the allocation` for this batch. Fix any failure the test names (usually a repeated question or a word-count overrun).

- [ ] **Step 4: Commit**

```bash
git add data/exams-N.js
git commit -m "feat: add exams X-Y"
```
(replace `N` and `X-Y` with the batch's file number and exam range)

---

### Task 9: Completeness check and final verification

**Implementer:** controller (this session)

**Files:**
- Modify: `test/exams.test.js`, `test/index.test.js`

**Interfaces:**
- Consumes: all six data files; `index.html`.

- [ ] **Step 1: Add the failing-if-incomplete tests**

Append to `test/exams.test.js`:
```js
test('the full set is present: exams 1 to 30, once each', () => {
  assert.deepEqual(exams.map(e => e.id).sort((a, b) => a - b), Array.from({ length: 30 }, (_, i) => i + 1));
});
```
Append to `test/index.test.js`:
```js
test('every script and stylesheet index.html references exists', () => {
  for (const f of [...srcs, 'style.css']) assert.ok(fs.existsSync(path.join(__dirname, '..', f)), f);
});
```

- [ ] **Step 2: Run the whole suite**

Run: `npm test`
Expected: PASS, `# fail 0` (if the completeness test fails, the output names the missing ids — re-run the matching batch task).

- [ ] **Step 3: Browser check** at `file:///C:/Users/MIKE/OneDrive/Desktop/ielts%20speaking/index.html`

Expected: "0 of 30 done" with 30 cards, zero console errors; Exam 7 opens, the 2-minute timer counts down and pressing it twice does not double-speed it; ticking "done" survives a reload; `#/exam/99` shows the list; at 375px width there is no horizontal scroll; Exam 1 has no "previous" link and Exam 30 no "next" link.

- [ ] **Step 4: Content skim** — read exams 3, 10, 17, 24 and 30 against the Global Constraints (personal Part 1, idea-based and escalating Part 3, no sensitive topics, examiner-like wording). Fix wording in place; re-run `npm test`.

- [ ] **Step 5: Commit**

```bash
git add test
git commit -m "test: completeness and index checks; final content pass"
```
