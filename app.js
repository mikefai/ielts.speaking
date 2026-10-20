// Classic script: plain globals in the browser (file://), module.exports under Node for tests.
const DONE_KEY = 'ielts-speaking-done';

function esc(s) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s).replace(/[&<>"']/g, c => map[c]);
}

function fmt(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function normalizeIds(list) {
  return [...new Set(list.filter(Number.isInteger))].sort((a, b) => a - b);
}

function loadDone(storage) {
  try {
    const v = JSON.parse(storage.getItem(DONE_KEY));
    return Array.isArray(v) ? normalizeIds(v) : [];
  } catch {
    return [];
  }
}

function setDone(storage, id, isDone) {
  const ids = loadDone(storage).filter(x => x !== id);
  if (isDone) ids.push(id);
  const next = normalizeIds(ids);
  try {
    storage.setItem(DONE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked or missing: the in-memory list is still correct for this page.
  }
  return next;
}

function parseRoute(hash, total) {
  const m = /^#\/exam\/(\d+)$/.exec(hash);
  const id = m ? Number(m[1]) : 0;
  return id >= 1 && id <= total ? { view: 'exam', id } : { view: 'list' };
}

function createTimer(onTick) {
  let handle;
  const stop = () => clearInterval(handle); // looked up at call time so mocked timers apply
  return {
    start(seconds) {
      stop();
      let left = seconds;
      onTick(left);
      if (left <= 0) return;
      handle = setInterval(() => {
        left -= 1;
        onTick(left);
        if (left <= 0) stop();
      }, 1000);
    },
    stop,
  };
}

function renderList(exams, doneIds) {
  const done = new Set(doneIds);
  const doneCount = exams.filter(e => done.has(e.id)).length;
  const cards = exams.map(e =>
    `<li><a class="card${done.has(e.id) ? ' done' : ''}" href="#/exam/${e.id}"><strong>Exam ${e.id}</strong> ${esc(e.part2.prompt)}</a></li>`
  ).join('');
  return `<p class="progress">${doneCount} of ${exams.length} done</p>\n<ul class="grid">${cards}</ul>`;
}

function renderExam(exam, isDone, total) {
  const { id, part1, part2, part3 } = exam;
  const items = list => list.map(q => `<li>${esc(q)}</li>`).join('');
  const links = [
    '<a href="#/">All exams</a>',
    id > 1 && `<a href="#/exam/${id - 1}">&larr; Exam ${id - 1}</a>`,
    id < total && `<a href="#/exam/${id + 1}">Exam ${id + 1} &rarr;</a>`,
  ].filter(Boolean);
  const p1 = part1.map(t => `<h4>${esc(t.topic)}</h4>\n<ol>${items(t.questions)}</ol>`).join('\n');
  const p2bullets = part2.bullets.map(b => `<li>${esc(b)}</li>`).join('');
  return `<nav class="nav">${links.join(' ')}</nav>
<h2>Exam ${id}</h2>
<section>
<h3>Part 1: Interview (4-5 min)</h3>
${p1}
</section>
<section>
<h3>Part 2: Long turn (1 min to prepare, up to 2 min to speak)</h3>
<div class="cue"><p>${esc(part2.prompt)}</p><p>You should say:</p><ul>${p2bullets}</ul></div>
<div class="timer"><button data-start="60">Start 1-minute preparation</button> <button data-start="120">Start 2-minute talk</button> <output id="timer">0:00</output></div>
</section>
<section>
<h3>Part 3: Discussion (4-5 min)</h3>
<p class="theme">Theme: ${esc(part3.theme)}</p>
<ol>${items(part3.questions)}</ol>
</section>
<label class="done-toggle"><input type="checkbox" data-done="${id}"${isDone ? ' checked' : ''}> Mark exam as done</label>`;
}

if (typeof document !== 'undefined') {
  const exams = (globalThis.EXAMS || []).slice().sort((a, b) => a.id - b.id);
  const app = document.getElementById('app');
  const store = () => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  };
  const timer = createTimer(n => {
    const out = document.getElementById('timer');
    if (out) out.textContent = fmt(n);
  });
  const show = () => {
    timer.stop();
    const route = parseRoute(location.hash, exams.length);
    const done = loadDone(store());
    // Falls back to the list if the routed exam is missing (e.g. its data file failed to load).
    const exam = route.view === 'exam' && exams.find(e => e.id === route.id);
    app.innerHTML = exam ? renderExam(exam, done.includes(exam.id), exams.length) : renderList(exams, done);
    window.scrollTo(0, 0);
  };
  app.addEventListener('click', e => {
    const button = e.target.closest('[data-start]');
    if (button) timer.start(Number(button.dataset.start));
  });
  app.addEventListener('change', e => {
    if (e.target.matches('[data-done]')) setDone(store(), Number(e.target.dataset.done), e.target.checked);
  });
  window.addEventListener('hashchange', show);
  show();
}

if (typeof module !== 'undefined') module.exports = { esc, fmt, loadDone, setDone, parseRoute, createTimer, renderList, renderExam };
