/* =======================
   MONEY MANAGER APP JS
   GitHub Pages Safe
======================= */

/* ---------- STATE ---------- */
const state = {
  transactions: JSON.parse(localStorage.getItem("transactions")) || [],
  budgets: JSON.parse(localStorage.getItem("budgets")) || {},
  darkMode: localStorage.getItem("darkMode") === "true",
  streak: JSON.parse(localStorage.getItem("streak")) || {
    count: 0,
    lastDate: null
  }
};

/* ---------- ELEMENTS ---------- */
const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll("[data-nav]");
const totalBalanceEl = document.getElementById("totalBalance");
const transactionList = document.getElementById("transaction-list");
const searchInput = document.getElementById("search");
const streakDisplay = document.getElementById("streakDisplay");

/* ---------- NAVIGATION ---------- */
function showPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  navButtons.forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-nav="${id}"]`)?.classList.add("active");
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.nav));
});

document.querySelectorAll(".fun-card").forEach(card => {
  card.addEventListener("click", () => showPage(card.dataset.page));
});

document.querySelectorAll(".back-btn").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.back));
});

/* ---------- STREAK SYSTEM ---------- */
function updateStreak() {
  const today = new Date().toDateString();

  if (state.streak.lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (state.streak.lastDate === yesterday.toDateString()) {
      state.streak.count++;
    } else {
      state.streak.count = 1;
    }

    state.streak.lastDate = today;
    localStorage.setItem("streak", JSON.stringify(state.streak));
  }

  streakDisplay.textContent = `🔥 Logging Streak: ${state.streak.count} days`;
}

/* ---------- TRANSACTIONS ---------- */
document.getElementById("addTransactionBtn").addEventListener("click", () => {
  const desc = document.getElementById("desc").value.trim();
  const amount = +document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;

  if (!desc || !amount) return alert("Fill all fields");

  state.transactions.push({
    id: Date.now(),
    desc,
    amount,
    type,
    category,
    date: new Date().toLocaleString()
  });

  saveTransactions();
  render();
});

/* Quick category buttons */
document.querySelectorAll(".quick-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById("category").value = btn.dataset.category;
  });
});

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(state.transactions));
}

/* ---------- RENDER TRANSACTIONS ---------- */
function renderTransactions(filter = "") {
  transactionList.innerHTML = "";

  state.transactions
    .filter(t => t.desc.toLowerCase().includes(filter.toLowerCase()))
    .reverse()
    .forEach(t => {
      const div = document.createElement("div");
      div.className = "transaction";
      div.innerHTML = `
        <strong>${t.desc}</strong>
        <span>${t.type === "expense" ? "-" : "+"}$${t.amount}</span>
        <small>${t.category} • ${t.date}</small>
      `;
      transactionList.appendChild(div);
    });
}

searchInput.addEventListener("input", e =>
  renderTransactions(e.target.value)
);

/* ---------- BALANCE ---------- */
function updateBalance() {
  const balance = state.transactions.reduce((sum, t) => {
    return t.type === "income" ? sum + t.amount : sum - t.amount;
  }, 0);

  totalBalanceEl.textContent = balance.toFixed(2);
}

/* ---------- CHARTS ---------- */
let barChart, pieChart;

function updateCharts() {
  const income = state.transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expense = state.transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  barChart?.destroy();
  pieChart?.destroy();

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense]
      }]
    }
  });

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense]
      }]
    }
  });
}

/* ---------- BUDGETS ---------- */
document.getElementById("setBudgetBtn").addEventListener("click", () => {
  const limit = +document.getElementById("budgetLimit").value;
  const category = document.getElementById("budgetCategory").value;

  if (!limit) return alert("Enter a limit");

  state.budgets[category] = limit;
  localStorage.setItem("budgets", JSON.stringify(state.budgets));
  alert("Budget saved");
});

/* ---------- SETTINGS ---------- */
document.getElementById("toggleDark").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  state.darkMode = !state.darkMode;
  localStorage.setItem("darkMode", state.darkMode);
});

document.getElementById("clearData").addEventListener("click", () => {
  if (!confirm("Clear all data?")) return;
  localStorage.clear();
  location.reload();
});

document.getElementById("exportCSV").addEventListener("click", () => {
  let csv = "Description,Amount,Type,Category,Date\n";
  state.transactions.forEach(t => {
    csv += `${t.desc},${t.amount},${t.type},${t.category},${t.date}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "transactions.csv";
  a.click();
});

/* ---------- MUSIC PLAYER ---------- */
const audio = document.getElementById("audioPlayer");
const playlistEl = document.getElementById("playlist");
const trackTitle = document.getElementById("trackTitle");
let tracks = [];
let currentTrack = 0;

document.getElementById("musicInput").addEventListener("change", e => {
  tracks = [...e.target.files];
  playlistEl.innerHTML = "";
  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = t.name;
    li.onclick = () => playTrack(i);
    playlistEl.appendChild(li);
  });
});

function playTrack(i) {
  currentTrack = i;
  audio.src = URL.createObjectURL(tracks[i]);
  trackTitle.textContent = tracks[i].name;
  audio.play();
}

document.getElementById("playPause").onclick = () =>
  audio.paused ? audio.play() : audio.pause();

document.getElementById("nextTrack").onclick = () =>
  playTrack((currentTrack + 1) % tracks.length);

document.getElementById("prevTrack").onclick = () =>
  playTrack((currentTrack - 1 + tracks.length) % tracks.length);

/* ---------- VIDEO ---------- */
document.getElementById("videoInput").addEventListener("change", e => {
  document.getElementById("videoPlayer").src =
    URL.createObjectURL(e.target.files[0]);
});

/* ---------- GAMES ---------- */
const games = [
  { name: "2048", url: "https://play2048.co/" },
  { name: "Tetris", url: "https://tetris.com/play-tetris" }
];

const gamesList = document.getElementById("gamesList");
const gameFrame = document.getElementById("gameFrame");
const gameContainer = document.getElementById("gameContainer");

games.forEach(g => {
  const div = document.createElement("div");
  div.className = "card";
  div.textContent = g.name;
  div.onclick = () => {
    gameFrame.src = g.url;
    gameContainer.classList.remove("hidden");
  };
  gamesList.appendChild(div);
});

document.getElementById("closeGame").onclick = () => {
  gameFrame.src = "";
  gameContainer.classList.add("hidden");
};

/* ---------- INIT ---------- */
function render() {
  updateBalance();
  renderTransactions();
  updateCharts();
}

if (state.darkMode) document.body.classList.add("dark");
updateStreak();
render();
