// ================= SAFE DOM READY =================
document.addEventListener("DOMContentLoaded", () => {

  // ================= DATA =================
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let budgets = JSON.parse(localStorage.getItem("budgets")) || {};
  let currentPage = "dashboard";

  let barChart = null;
  let pieChart = null;

  // ================= PAGE NAVIGATION =================
  function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const page = document.getElementById(pageId);
    if (!page) return;

    page.classList.add("active");
    currentPage = pageId;

    // Bottom nav highlight
    document.querySelectorAll(".bottom-nav button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.nav === pageId);
    });

    // Page-specific renders
    if (pageId === "dashboard") {
      setTimeout(renderCharts, 50);
    }
    if (pageId === "history") {
      renderTransactions();
    }
  }

  // ================= SAVE =================
  function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }

  // ================= TRANSACTIONS =================
  function addTransaction(desc, amount, type, category) {
    if (!desc || isNaN(amount)) return alert("Invalid input");

    transactions.push({
      desc,
      amount,
      type,
      category,
      date: new Date().toISOString()
    });

    saveData();
    renderTransactions();
    renderCharts();
    updateStreak();
    checkBudget(category);
  }

  document.getElementById("addTransactionBtn")?.addEventListener("click", () => {
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    addTransaction(desc, amount, typeSelect.value, categorySelect.value);
    descInput.value = "";
    amountInput.value = "";
  });

  // Quick buttons
  document.querySelectorAll(".quick-buttons button").forEach(btn => {
    btn.onclick = () => {
      const amount = parseFloat(prompt(`Amount for ${btn.dataset.category}`));
      if (!isNaN(amount)) {
        addTransaction(btn.dataset.category, amount, "expense", btn.dataset.category);
      }
    };
  });

  // ================= HISTORY =================
  function renderTransactions() {
    const list = document.getElementById("transaction-list");
    if (!list) return;

    const search = document.getElementById("search").value.toLowerCase();
    list.innerHTML = "";

    transactions
      .filter(t => t.desc.toLowerCase().includes(search))
      .forEach((t, i) => {
        const item = document.createElement("div");
        item.className = "transaction-item";
        item.innerHTML = `
          <span>${t.desc} (${t.category})</span>
          <span>${t.type === "expense" ? "-" : "+"}$${t.amount.toFixed(2)}</span>
          <button data-i="${i}">✖</button>
        `;
        item.querySelector("button").onclick = () => {
          transactions.splice(i, 1);
          saveData();
          renderTransactions();
          renderCharts();
        };
        list.appendChild(item);
      });
  }

  // ================= CHARTS =================
  function renderCharts() {
    const bar = document.getElementById("barChart");
    const pie = document.getElementById("pieChart");
    if (!bar || !pie) return;

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();

    const daily = {};
    transactions.forEach(t => {
      const d = t.date.split("T")[0];
      daily[d] = (daily[d] || 0) + (t.type === "income" ? t.amount : -t.amount);
    });

    barChart = new Chart(bar, {
      type: "bar",
      data: {
        labels: Object.keys(daily),
        datasets: [{ data: Object.values(daily), backgroundColor: "#4a90e2" }]
      }
    });

    const categories = {};
    transactions.forEach(t => {
      if (t.type === "expense") {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });

    pieChart = new Chart(pie, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [{ data: Object.values(categories) }]
      }
    });

    document.getElementById("totalBalance").textContent =
      transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0).toFixed(2);
  }

  // ================= STREAK =================
  function updateStreak() {
    const streakEl = document.getElementById("streakDisplay");
    if (!streakEl) return;
    streakEl.textContent = `🔥 Logging Streak: ${transactions.length} days`;
  }

  // ================= SETTINGS =================
  document.getElementById("toggleDark")?.onclick = () =>
    document.body.classList.toggle("dark-mode");

  document.getElementById("clearData")?.onclick = () => {
    if (confirm("Clear all data?")) {
      transactions = [];
      budgets = {};
      saveData();
      renderTransactions();
      renderCharts();
    }
  };

  // ================= FUN NAV =================
  document.querySelectorAll(".fun-card").forEach(card => {
    card.onclick = () => showPage(card.dataset.page);
  });

  document.querySelectorAll(".back-btn").forEach(btn => {
    btn.onclick = () => showPage(btn.dataset.back);
  });

  // ================= MUSIC =================
  const audio = document.getElementById("audioPlayer");
  let tracks = [], index = 0;

  document.getElementById("musicInput")?.onchange = e => {
    tracks = [...e.target.files];
    index = 0;
    playTrack();
  };

  function playTrack() {
    if (!tracks.length) return;
    audio.src = URL.createObjectURL(tracks[index]);
    audio.play();
  }

  document.getElementById("nextTrack")?.onclick = () => {
    index = (index + 1) % tracks.length;
    playTrack();
  };

  document.getElementById("prevTrack")?.onclick = () => {
    index = (index - 1 + tracks.length) % tracks.length;
    playTrack();
  };

  document.getElementById("playPause")?.onclick = () =>
    audio.paused ? audio.play() : audio.pause();

  // ================= GAMES =================
  const games = [
    { name: "Mini Game 1", url: "games/game1/index.html" },
    { name: "Mini Game 2", url: "games/game2/index.html" }
  ];

  const gamesList = document.getElementById("gamesList");
  const gameFrame = document.getElementById("gameFrame");
  const gameContainer = document.getElementById("gameContainer");

  if (gamesList) {
    games.forEach(g => {
      const card = document.createElement("div");
      card.className = "card fun-card";
      card.textContent = g.name;
      card.onclick = () => {
        gameContainer.classList.remove("hidden");
        gameFrame.src = g.url;
      };
      gamesList.appendChild(card);
    });
  }

  document.getElementById("closeGame")?.onclick = () => {
    gameContainer.classList.add("hidden");
    gameFrame.src = "";
  };

  // ================= BOTTOM NAV =================
  document.querySelectorAll(".bottom-nav button").forEach(btn => {
    btn.onclick = () => showPage(btn.dataset.nav);
  });

  // ================= INIT =================
  showPage("dashboard");
});
