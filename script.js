document.addEventListener("DOMContentLoaded", () => {

/* ================= DATA ================= */
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let currentPage = 'dashboard';

/* ================= NAVIGATION ================= */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  currentPage = pageId;

  // Bottom nav active state
  document.querySelectorAll('.bottom-nav button').forEach(btn => btn.classList.remove('active'));
  const btnMap = { dashboard:0, add:1, history:2, fun:3 };
  if (btnMap[pageId] !== undefined) {
    document.querySelectorAll('.bottom-nav button')[btnMap[pageId]].classList.add('active');
  }

  if (pageId === 'dashboard') renderCharts();
  if (pageId === 'history') renderTransactions();
  if (pageId !== 'games') closeGame();
}
window.showPage = showPage;

/* ================= SAVE ================= */
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('budgets', JSON.stringify(budgets));
}

/* ================= ADD TRANSACTION ================= */
function manualAdd() {
  const desc = document.getElementById('desc').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  addTransaction(desc, amount, type, category);
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
}
window.manualAdd = manualAdd;

function addTransaction(desc, amount, type='expense', category='Other') {
  if (!desc || isNaN(amount)) return alert('Enter valid data');
  transactions.push({ desc, amount, type, category, date: new Date().toISOString() });
  saveData();
  renderTransactions();
  renderCharts();
  checkBudget(category);
}

/* ================= QUICK ADD ================= */
function quickAdd(category) {
  const amount = parseFloat(prompt(`Enter amount for ${category}`));
  if (!isNaN(amount)) addTransaction(category, amount, 'expense', category);
}
window.quickAdd = quickAdd;

/* ================= TRANSACTIONS ================= */
function renderTransactions() {
  const list = document.getElementById('transaction-list');
  if (!list) return;
  const search = document.getElementById('search')?.value.toLowerCase() || '';
  list.innerHTML = '';

  transactions
    .filter(t => t.desc.toLowerCase().includes(search) || t.category.toLowerCase().includes(search))
    .forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'transaction-item';
      div.innerHTML = `
        <span>${t.desc} (${t.category})</span>
        <span>${t.type === 'expense' ? '-' : '+'}$${t.amount.toFixed(2)}</span>
        <button onclick="deleteTransaction(${i})">✖</button>
      `;
      list.appendChild(div);
    });

  updateStreak();
}
window.renderTransactions = renderTransactions;

function deleteTransaction(i) {
  if (confirm('Delete transaction?')) {
    transactions.splice(i,1);
    saveData();
    renderTransactions();
    renderCharts();
  }
}
window.deleteTransaction = deleteTransaction;

/* ================= CHARTS ================= */
let barChart, pieChart;
function renderCharts() {
  const bar = document.getElementById('barChart');
  const pie = document.getElementById('pieChart');
  if (!bar || !pie) return;

  const daily = {};
  transactions.forEach(t => {
    const d = t.date.split('T')[0];
    daily[d] = (daily[d] || 0) + (t.type === 'income' ? t.amount : -t.amount);
  });

  if (barChart) barChart.destroy();
  barChart = new Chart(bar, {
    type:'bar',
    data:{ labels:Object.keys(daily), datasets:[{ data:Object.values(daily), backgroundColor:'#4a90e2' }] }
  });

  const cats = [...new Set(transactions.map(t => t.category))];
  const sums = cats.map(c => transactions.filter(t => t.category===c && t.type==='expense')
    .reduce((s,t)=>s+t.amount,0));

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(pie, {
    type:'pie',
    data:{ labels:cats, datasets:[{ data:sums }] }
  });

  document.getElementById('totalBalance').textContent =
    transactions.reduce((s,t)=>t.type==='income'?s+t.amount:s-t.amount,0).toFixed(2);
}

/* ================= BUDGETS ================= */
function setBudget() {
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  const cat = document.getElementById('budgetCategory').value;
  if (!isNaN(limit)) {
    budgets[cat] = limit;
    saveData();
    alert(`Budget set for ${cat}`);
  }
}
window.setBudget = setBudget;

function checkBudget(cat) {
  if (!budgets[cat]) return;
  const spent = transactions.filter(t=>t.category===cat && t.type==='expense')
    .reduce((s,t)=>s+t.amount,0);
  if (spent > budgets[cat]) alert(`${cat} budget exceeded`);
}

/* ================= STREAK ================= */
function updateStreak() {
  if (!transactions.length) return;
  const days = [...new Set(transactions.map(t=>t.date.split('T')[0]))];
  document.getElementById('streakDisplay').textContent = `🔥 Logging Streak: ${days.length} days`;
}

/* ================= SETTINGS ================= */
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}
window.toggleDarkMode = toggleDarkMode;

function exportCSV() {
  if (!transactions.length) return;
  let csv = 'Desc,Amount,Type,Category,Date\n';
  transactions.forEach(t => csv += `${t.desc},${t.amount},${t.type},${t.category},${t.date}\n`);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download = 'transactions.csv';
  a.click();
}
window.exportCSV = exportCSV;

function clearAll() {
  if (confirm('Clear all data?')) {
    transactions = [];
    budgets = {};
    saveData();
    renderTransactions();
    renderCharts();
  }
}
window.clearAll = clearAll;

/* ================= MUSIC PLAYER ================= */
let musicTracks = [], trackIndex = 0;
const audio = document.getElementById('audioPlayer');
const playlist = document.getElementById('playlist');
const title = document.getElementById('trackTitle');

document.getElementById('musicInput')?.addEventListener('change', e => {
  musicTracks = [...e.target.files];
  trackIndex = 0;
  loadTrack();
  playlist.innerHTML = musicTracks.map((t,i)=>`<li onclick="playTrack(${i})">${t.name}</li>`).join('');
});

function loadTrack() {
  if (!musicTracks.length) return;
  audio.src = URL.createObjectURL(musicTracks[trackIndex]);
  title.textContent = musicTracks[trackIndex].name;
  audio.play();
}
window.playTrack = i => { trackIndex=i; loadTrack(); };

/* ================= VIDEO ================= */
document.getElementById('videoInput')?.addEventListener('change', e => {
  const v = document.getElementById('videoPlayer');
  v.src = URL.createObjectURL(e.target.files[0]);
});

/* ================= GAMES ================= */
const games = [
  { name:'Mini Game 1', url:'games/game1/index.html' },
  { name:'Mini Game 2', url:'games/game2/index.html' }
];

function renderGames() {
  const list = document.getElementById('gamesList');
  if (!list) return;
  list.innerHTML = '';
  games.forEach(g => {
    const d = document.createElement('div');
    d.className = 'card fun-card';
    d.textContent = g.name;
    d.onclick = () => openGame(g.url);
    list.appendChild(d);
  });
}

function openGame(url) {
  document.getElementById('gameContainer').classList.remove('hidden');
  document.getElementById('gameFrame').src = url;
}
window.openGame = openGame;

function closeGame() {
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('gameFrame').src = '';
}
window.closeGame = closeGame;

/* ================= INIT ================= */
renderTransactions();
renderCharts();
renderGames();
showPage('dashboard');

});
