const STORE_KEY = 'timetable_v3';

const defaultState = () => ({ tasks: [], events: [], collapsedBands: {} });

function loadState() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const s = defaultState();
    if (Array.isArray(d.tasks))  s.tasks  = d.tasks;
    if (Array.isArray(d.events)) s.events = d.events;
    if (d.collapsedBands)        s.collapsedBands = d.collapsedBands;
    return s;
  } catch { return defaultState(); }
}

function saveState(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function todayStr() { return new Date().toISOString().slice(0,10); }

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((d - t) / 86400000);
}

function deadlineStatus(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return null;
  if (d < 0)   return 'overdue';
  if (d === 0) return 'today';
  if (d <= 7)  return 'soon';
  return 'future';
}

function deadlineLabel(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return '';
  if (d < 0)   return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Tomorrow';
  if (d <= 7)  return `${d}d left`;
  return `${d} days`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: '2-digit'
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function startClock(elId) {
  const update = () => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };
  update();
  setInterval(update, 1000);
}

function updateNavBadges() {
  const s = loadState();
  const active = s.tasks.filter(t => !t.done);
  const done   = s.tasks.filter(t => t.done);
  const b = {
    'nav-badge-priority':  active.length,
    'nav-badge-calendar':  s.events.length,
    'nav-badge-completed': done.length
  };
  Object.entries(b).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function exportAll() {
  const s = loadState();
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `timetable-${todayStr()}.json`;
  a.click();
  showToast('Data exported');
}

function importAll(file, onDone) {
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (confirm('Replace all data with imported data?')) {
        const s = defaultState();
        if (Array.isArray(d.tasks))  s.tasks  = d.tasks;
        if (Array.isArray(d.events)) s.events = d.events;
        saveState(s);
        showToast('Data imported');
        if (onDone) onDone();
      }
    } catch { showToast('Invalid file'); }
  };
  reader.readAsText(file);
}

function seedDemo() {
  const s = loadState();
  if (s.tasks.length > 0 || s.events.length > 0) return;
  const td = todayStr();
  const d  = n => new Date(Date.now() + n * 86400000).toISOString().slice(0,10);
  s.tasks = [
    { id: uid(), name: 'Submit quarterly report', priority: 'high', deadline: td, time: '17:00', note: 'Include financials & exec summary', done: false, subitems: [
      { id: uid(), name: 'Compile financials', done: true },
      { id: uid(), name: 'Write executive summary', done: false },
      { id: uid(), name: 'Send to manager', done: false }
    ], createdAt: Date.now() },
    { id: uid(), name: 'Doctor appointment follow-up', priority: 'high', deadline: d(1), time: '10:30', note: '', done: false, subitems: [], createdAt: Date.now() },
    { id: uid(), name: 'Review project proposal', priority: 'med', deadline: d(3), time: '12:00', note: 'Check budget section carefully', done: false, subitems: [
      { id: uid(), name: 'Read through draft', done: true },
      { id: uid(), name: 'Add feedback notes', done: false }
    ], createdAt: Date.now() },
    { id: uid(), name: 'Grocery shopping', priority: 'med', deadline: d(2), time: '', note: '', done: false, subitems: [], createdAt: Date.now() },
    { id: uid(), name: 'Read "Atomic Habits"', priority: 'low', deadline: d(14), time: '', note: 'At least 2 chapters/day', done: false, subitems: [], createdAt: Date.now() },
    { id: uid(), name: 'Morning run', priority: 'low', deadline: '', time: '07:00', note: '', done: true, subitems: [], createdAt: Date.now(), completedAt: Date.now() - 3600000 }
  ];
  s.events = [
    { id: uid(), title: 'Team standup', date: td, time: '09:00', priority: 'med', note: '' },
    { id: uid(), title: 'Project review', date: d(2), time: '14:00', priority: 'high', note: 'Bring slides' },
    { id: uid(), title: 'Dentist', date: d(5), time: '11:30', priority: 'med', note: '' },
    { id: uid(), title: 'Gym session', date: d(1), time: '18:00', priority: 'low', note: '' }
  ];
  saveState(s);
}