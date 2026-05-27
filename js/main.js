import { loginGoogle, logout, onAuthChange, currentUser,
         getTasks, saveTasks, getStreak, saveStreak,
         getDailyQuote, saveDailyQuote, getProfile }
  from './firebase.js';

// Expõe funções para uso inline no HTML
window._fb = { loginGoogle, logout };

// ── Clock & Date ──────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = `${h}:${m}`;

  const secEl = document.getElementById('clock-sec');
  if (secEl) secEl.textContent = `:${s}`;

  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dateEl = document.getElementById('date-label');
  if (dateEl) {
    dateEl.textContent = `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
  }
}
setInterval(updateClock, 1000);
updateClock();

// ── Random Quote ──────────────────────────────────────────
async function loadQuote() {
  const today = new Date().toDateString();
  let stored = await getDailyQuote();
  let frase;
  if (stored && stored.date === today) {
    frase = stored.frase;
  } else {
    frase = frases[Math.floor(Math.random() * frases.length)];
    await saveDailyQuote({ date: today, frase });
  }
  const textoEl = document.getElementById('quote-text');
  const autorEl = document.getElementById('quote-author');
  if (textoEl) textoEl.textContent = `"${frase.texto}"`;
  if (autorEl) autorEl.textContent = `— ${frase.autor}`;
}

// ── Tasks ─────────────────────────────────────────────────
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

window.getTasks = getTasks;
window.saveTasks = saveTasks;
window.getTodayKey = getTodayKey;

async function renderTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;
  const allTasks = await getTasks();
  const tasks = allTasks.filter(t => t.date === getTodayKey() || !t.date);
  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:20px 0;color:var(--muted);">
      <span style="font-size:28px;">✓</span>
      <p style="margin:8px 0 0;font-size:13px;">Nenhuma tarefa ainda. Adicione uma abaixo!</p>
    </div>`;
    updateProgress([]);
    return;
  }

  const tagColors = {
    basquete: ['rgba(124,111,247,.15)', '#a89cf7'],
    faculdade: ['rgba(52,211,153,.12)', '#34d399'],
    pessoal:   ['rgba(251,191,36,.12)', '#fbbf24'],
    financeiro:['rgba(248,113,113,.12)', '#f87171'],
    projeto:   ['rgba(96,165,250,.12)', '#60a5fa'],
    outro:     ['rgba(255,255,255,.07)', '#6b7280'],
  };

  tasks.forEach((task, i) => {
    const [bg, color] = tagColors[task.tag] || tagColors.outro;
    const div = document.createElement('div');
    div.className = 'task-row' + (task.done ? ' done' : '');
    div.innerHTML = `
      <button class="task-check-btn ${task.done ? 'checked' : ''}" onclick="window.toggleTask(${i})" aria-label="Marcar">
        ${task.done ? '<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
      </button>
      <span class="task-label">${task.text}</span>
      <span class="task-tag-pill" style="background:${bg};color:${color};">${task.tag}</span>
      <button class="task-del-btn" onclick="window.deleteTask(${i})" aria-label="Remover">×</button>`;
    list.appendChild(div);
  });

  updateProgress(tasks);
}
window.renderTasks = renderTasks;

function updateProgress(tasks) {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const bar = document.getElementById('progress-bar');
  const label = document.getElementById('progress-label');
  if (bar) bar.style.width = total ? `${(done / total) * 100}%` : '0%';
  if (label) label.textContent = total ? `${done} de ${total} tarefas` : '';
}

window.toggleTask = async function(i) {
  const allTasks = await getTasks();
  const todayTasks = allTasks.filter(t => t.date === getTodayKey() || !t.date);
  const target = todayTasks[i];
  const idx = allTasks.findIndex(t => t.text === target.text && t.date === target.date);
  if (idx > -1) {
    allTasks[idx].done = !allTasks[idx].done;
    await saveTasks(allTasks);
    renderTasks();
  }
};

window.deleteTask = async function(i) {
  const allTasks = await getTasks();
  const todayTasks = allTasks.filter(t => t.date === getTodayKey() || !t.date);
  const target = todayTasks[i];
  const newTasks = allTasks.filter(t => !(t.text === target.text && t.date === target.date));
  await saveTasks(newTasks);
  renderTasks();
};

window.addTask = async function() {
  const input = document.getElementById('new-task-input');
  const tagSelect = document.getElementById('new-task-tag');
  if (!input || !input.value.trim()) return;
  const allTasks = await getTasks();
  allTasks.push({ text: input.value.trim(), tag: tagSelect.value, done: false, date: getTodayKey() });
  await saveTasks(allTasks);
  input.value = '';
  renderTasks();
  updateStreak();
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement?.id === 'new-task-input') window.addTask();
});

// ── Streak ────────────────────────────────────────────────
async function updateStreak() {
  const stored = await getStreak();
  const today = getTodayKey();
  if (!stored.days.includes(today)) {
    stored.days.push(today);
    stored.days = stored.days.slice(-30);
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const dk = d.toISOString().split('T')[0];
      if (stored.days.includes(dk)) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    stored.count = count;
    await saveStreak(stored);
  }
  renderStreak(stored);
}

function renderStreak(data) {
  const el = document.getElementById('streak-count');
  if (el) el.textContent = `🔥 ${data.count} dia${data.count !== 1 ? 's' : ''} seguido${data.count !== 1 ? 's' : ''}`;
  const dotsEl = document.getElementById('streak-dots');
  if (!dotsEl) return;
  const shortDays = ['D','S','T','Q','Q','S','S'];
  dotsEl.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = d.toISOString().split('T')[0];
    const active = data.days.includes(dk);
    const dot = document.createElement('div');
    dot.className = 'streak-dot' + (active ? ' active' : '');
    dot.textContent = shortDays[d.getDay()];
    dot.title = dk;
    dotsEl.appendChild(dot);
  }
}

// ── Auth UI ───────────────────────────────────────────────
function renderAuthBtn(user) {
  // Atualiza avatar no header
  const avatarEl = document.getElementById('header-avatar');
  if (!avatarEl) return;
  if (user) {
    avatarEl.style.backgroundImage = `url(${user.photoURL})`;
    avatarEl.style.backgroundSize = 'cover';
    avatarEl.style.backgroundPosition = 'center';
    avatarEl.style.borderRadius = '50%';
    avatarEl.textContent = '';
  } else {
    avatarEl.style.backgroundImage = '';
    avatarEl.textContent = '👤';
  }
}

// ── Nav highlight ─────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === path);
  });
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setActiveNav();

  onAuthChange(async (user) => {
    renderAuthBtn(user);
    await loadQuote();
    await renderTasks();
    const streak = await getStreak();
    renderStreak(streak);
    await updateStreak();
  });
});