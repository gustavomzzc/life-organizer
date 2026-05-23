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
function loadQuote() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('daily_quote') || 'null');
  let frase;
  if (stored && stored.date === today) {
    frase = stored.frase;
  } else {
    frase = frases[Math.floor(Math.random() * frases.length)];
    localStorage.setItem('daily_quote', JSON.stringify({ date: today, frase }));
  }
  const textoEl = document.getElementById('quote-text');
  const autorEl = document.getElementById('quote-author');
  if (textoEl) textoEl.textContent = `"${frase.texto}"`;
  if (autorEl) autorEl.textContent = `— ${frase.autor}`;
}

// ── Tasks ────────────────────────────────────────────────
function getTasks() {
  return JSON.parse(localStorage.getItem('tasks') || '[]');
}
function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function renderTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;
  const tasks = getTasks().filter(t => t.date === getTodayKey() || !t.date);
  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:20px 0;color:var(--muted);">
      <span style="font-size:28px;">✓</span>
      <p style="margin:8px 0 0;font-size:13px;">Nenhuma tarefa ainda. Adicione uma abaixo!</p>
    </div>`;
    return;
  }

  const tagColors = {
    'basquete': ['#e8e4ff','#3C3489'],
    'faculdade': ['#e1f5ee','#085041'],
    'pessoal': ['#faeeda','#633806'],
    'financeiro': ['#fce8e8','#791F1F'],
    'projeto': ['#eaf3de','#27500A'],
    'outro': ['#f1efe8','#444441']
  };

  tasks.forEach((task, i) => {
    const colors = tagColors[task.tag] || tagColors['outro'];
    const div = document.createElement('div');
    div.className = 'task-row' + (task.done ? ' task-done' : '');
    div.innerHTML = `
      <button class="task-check-btn${task.done ? ' checked' : ''}" onclick="toggleTask(${i})" aria-label="${task.done ? 'Desmarcar' : 'Marcar como feito'}">
        ${task.done ? '<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
      </button>
      <span class="task-label">${task.text}</span>
      <span class="task-tag-pill" style="background:${colors[0]};color:${colors[1]}">${task.tag}</span>
      <button class="task-del-btn" onclick="deleteTask(${i})" aria-label="Remover tarefa">
        <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>`;
    list.appendChild(div);
  });

  updateProgress(tasks);
}

function updateProgress(tasks) {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const bar = document.getElementById('progress-bar');
  const label = document.getElementById('progress-label');
  if (bar) bar.style.width = total ? `${(done / total) * 100}%` : '0%';
  if (label) label.textContent = total ? `${done} de ${total} tarefas` : '';
}

function toggleTask(i) {
  const tasks = getTasks().filter(t => t.date === getTodayKey() || !t.date);
  const allTasks = getTasks();
  const taskIndex = allTasks.findIndex(t => t === tasks[i] || (t.text === tasks[i].text && t.date === tasks[i].date));
  if (taskIndex > -1) {
    allTasks[taskIndex].done = !allTasks[taskIndex].done;
    saveTasks(allTasks);
    renderTasks();
  }
}

function deleteTask(i) {
  const tasks = getTasks().filter(t => t.date === getTodayKey() || !t.date);
  const target = tasks[i];
  const allTasks = getTasks().filter(t => !(t.text === target.text && t.date === target.date));
  saveTasks(allTasks);
  renderTasks();
}

function addTask() {
  const input = document.getElementById('new-task-input');
  const tagSelect = document.getElementById('new-task-tag');
  if (!input || !input.value.trim()) return;
  const tasks = getTasks();
  tasks.push({ text: input.value.trim(), tag: tagSelect.value, done: false, date: getTodayKey() });
  saveTasks(tasks);
  input.value = '';
  renderTasks();
  updateStreak();
}

// Enter key on input
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement?.id === 'new-task-input') addTask();
});

// ── Streak ────────────────────────────────────────────────
function updateStreak() {
  const key = 'streak_data';
  const stored = JSON.parse(localStorage.getItem(key) || '{"days":[],"count":0}');
  const today = getTodayKey();
  if (!stored.days.includes(today)) {
    stored.days.push(today);
    stored.days = stored.days.slice(-30);
    // Check consecutive
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const dk = d.toISOString().split('T')[0];
      if (stored.days.includes(dk)) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    stored.count = count;
    localStorage.setItem(key, JSON.stringify(stored));
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

// ── Nav highlight ─────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === path);
  });
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadQuote();
  renderTasks();
  const streak = JSON.parse(localStorage.getItem('streak_data') || '{"days":[],"count":0}');
  renderStreak(streak);
  updateStreak();
  setActiveNav();
});
