// ================= DATA =================
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let currentPage = 'dashboard';

// ================= NAVIGATION =================
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show selected page
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    currentPage = pageId;

    // Finance updates
    if (pageId === 'dashboard') renderCharts();
    if (pageId === 'history') renderTransactions();

    // Bottom nav highlight
    document.querySelectorAll('.bottom-nav button').forEach(btn => btn.classList.remove('active'));
    const navBtn = document.querySelector(`.bottom-nav button[data-nav="${pageId}"]`);
    if (navBtn) navBtn.classList.add('active');
}

// ================= SAVE / LOAD =================
function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

// ================= TRANSACTIONS =================
function addTransaction(desc, amount, type='expense', category='Other') {
    if (!desc || !amount || isNaN(amount)) return alert('Enter valid description and amount');
    transactions.push({ desc, amount, type, category, date: new Date().toISOString() });
    saveData();
    renderTransactions();
    renderCharts();
    checkBudget(category);
}

// Manual Add
document.getElementById('addTransactionBtn')?.addEventListener('click', () => {
    const desc = document.getElementById('desc').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    addTransaction(desc, amount, type, category);
    document.getElementById('desc').value = '';
    document.getElementById('amount').value = '';
});

// Quick Add
document.querySelectorAll('.quick-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        const amount = parseFloat(prompt(`Enter amount for ${category}:`));
        if (!amount || isNaN(amount)) return;
        addTransaction(category, amount, 'expense', category);
    });
});

// ================= RENDER TRANSACTIONS =================
function renderTransactions() {
    const search = document.getElementById('search')?.value.toLowerCase() || '';
    const list = document.getElementById('transaction-list');
    if (!list) return;
    list.innerHTML = '';

    transactions
        .filter(t => t.desc.toLowerCase().includes(search) || t.category.toLowerCase().includes(search))
        .forEach((t, index) => {
            const div = document.createElement('div');
            div.className = 'transaction-item';
            div.innerHTML = `
                <span>${t.desc} (${t.category})</span>
                <span>${t.type==='expense'?'-':'+'}$${t.amount.toFixed(2)}</span>
                <button class="delete-btn" data-index="${index}">x</button>
            `;
            list.appendChild(div);
        });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            if (confirm('Delete this transaction?')) {
                transactions.splice(idx,1);
                saveData();
                renderTransactions();
                renderCharts();
                updateStreak();
            }
        });
    });

    updateStreak();
}

// ================= CHARTS =================
let barChart, pieChart;
function renderCharts() {
    const ctxBar = document.getElementById('barChart')?.getContext('2d');
    const ctxPie = document.getElementById('pieChart')?.getContext('2d');
    if (!ctxBar || !ctxPie) return;

    // Daily balance
    const dailyTotals = {};
    transactions.forEach(t => {
        const day = t.date.split('T')[0];
        dailyTotals[day] = (dailyTotals[day] || 0) + (t.type==='income'?t.amount:-t.amount);
    });
    const barData = { labels: Object.keys(dailyTotals), datasets: [{ label: 'Daily Balance', data: Object.values(dailyTotals), backgroundColor: '#4a90e2' }] };

    // Pie chart
    const categories = [...new Set(transactions.map(t => t.category))];
    const categorySums = categories.map(c => transactions.filter(t => t.category===c).reduce((sum, t) => t.type==='expense'?sum+t.amount:sum, 0));
    const pieData = { labels: categories, datasets: [{ label: 'Category Expenses', data: categorySums, backgroundColor: categories.map(() => '#' + Math.floor(Math.random()*16777215).toString(16)) }] };

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();
    barChart = new Chart(ctxBar, { type: 'bar', data: barData, options: { animation: { duration: 800, easing: 'easeOutQuart' } } });
    pieChart = new Chart(ctxPie, { type: 'pie', data: pieData, options: { animation: { duration: 1000, easing: 'easeOutBounce' } } });

    // Update total balance
    const total = document.getElementById('totalBalance');
    if (total) total.textContent = transactions.reduce((sum, t) => t.type==='income'?sum+t.amount:sum-t.amount, 0).toFixed(2);
}

// ================= BUDGETS =================
document.getElementById('setBudgetBtn')?.addEventListener('click', () => {
    const limit = parseFloat(document.getElementById('budgetLimit').value);
    const category = document.getElementById('budgetCategory').value;
    if (!limit || isNaN(limit)) return alert('Enter valid limit');
    budgets[category] = limit;
    saveData();
    alert(`Budget for ${category} set to $${limit}`);
    checkAllBudgets();
});

function checkBudget(category) {
    if (!budgets[category]) return;
    const spent = transactions.filter(t => t.type==='expense' && t.category===category).reduce((sum,t)=>sum+t.amount,0);
    if (spent > budgets[category]) alert(`⚠️ ${category} spending $${spent} exceeds limit $${budgets[category]}!`);
}
function checkAllBudgets() { Object.keys(budgets).forEach(c=>checkBudget(c)); }

// ================= STREAK =================
function updateStreak() {
    if (transactions.length === 0) return document.getElementById('streakDisplay').textContent = '🔥 Logging Streak: 0 days';
    transactions.sort((a,b)=>new Date(a.date)-new Date(b.date));
    const today = new Date();
    let streak = 0;
    for(let i=transactions.length-1;i>=0;i--){
        const tDate = new Date(transactions[i].date);
        const diffDays = Math.floor((today-tDate)/(1000*60*60*24));
        if(diffDays===streak) streak++;
        else break;
    }
    document.getElementById('streakDisplay').textContent = `🔥 Logging Streak: ${streak} day${streak>1?'s':''}`;
}

// ================= SETTINGS =================
document.getElementById('toggleDark')?.addEventListener('click', ()=> document.body.classList.toggle('dark-mode'));
document.getElementById('exportCSV')?.addEventListener('click', ()=>{
    if(transactions.length===0)return alert('No transactions to export');
    let csv = 'Description,Amount,Type,Category,Date\n';
    transactions.forEach(t=>{csv+=`${t.desc},${t.amount},${t.type},${t.category},${t.date}\n`});
    const blob=new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='transactions.csv'; a.click();
    URL.revokeObjectURL(url);
});
document.getElementById('clearData')?.addEventListener('click', ()=>{
    if(confirm('Clear all data?')){
        transactions=[]; budgets={};
        saveData(); renderTransactions(); renderCharts(); updateStreak();
        alert('All data cleared');
    }
});

// ================= MUSIC PLAYER =================
let musicTracks=[], currentTrackIndex=0;
const audioPlayer=document.getElementById('audioPlayer');
const playlistEl=document.getElementById('playlist');
const trackTitle=document.getElementById('trackTitle');

document.getElementById('musicInput')?.addEventListener('change', e=>{
    musicTracks=Array.from(e.target.files);
    currentTrackIndex=0; loadTrack(); renderPlaylist();
});

function loadTrack(){
    if(musicTracks.length===0)return;
    audioPlayer.src = URL.createObjectURL(musicTracks[currentTrackIndex]);
    trackTitle.textContent=musicTracks[currentTrackIndex].name;
    audioPlayer.play();
}

function renderPlaylist(){
    playlistEl.innerHTML='';
    musicTracks.forEach((track,i)=>{
        const li=document.createElement('li');
        li.textContent=track.name;
        li.onclick=()=>{currentTrackIndex=i; loadTrack();};
        playlistEl.appendChild(li);
    });
}

document.getElementById('playPause')?.addEventListener('click', ()=>{audioPlayer.paused?audioPlayer.play():audioPlayer.pause();});
document.getElementById('prevTrack')?.addEventListener('click', ()=>{
    if(musicTracks.length===0)return;
    currentTrackIndex=(currentTrackIndex-1+musicTracks.length)%musicTracks.length; loadTrack();
});
document.getElementById('nextTrack')?.addEventListener('click', ()=>{
    if(musicTracks.length===0)return;
    currentTrackIndex=(currentTrackIndex+1)%musicTracks.length; loadTrack();
});

// ================= VIDEO PLAYER =================
document.getElementById('videoInput')?.addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    document.getElementById('videoPlayer').src = URL.createObjectURL(file);
});

// ================= GAMES =================
const gamesListEl=document.getElementById('gamesList');
const gameContainer=document.getElementById('gameContainer');
const gameFrame=document.getElementById('gameFrame');

const games=[
    {name:'Mini Game 1', url:'games/game1/index.html'},
    {name:'Mini Game 2', url:'games/game2/index.html'}
];

function renderGames(){
    if(!gamesListEl)return;
    gamesListEl.innerHTML='';
    games.forEach((g,i)=>{
        const div=document.createElement('div');
        div.className='card fun-card';
        div.textContent=g.name;
        div.onclick=()=>openGame(i);
        gamesListEl.appendChild(div);
    });
}

function openGame(index){
    if(!games[index])return;
    gameContainer.classList.remove('hidden');
    gameFrame.src = games[index].url;
}

document.getElementById('closeGame')?.addEventListener('click', ()=>{
    gameContainer.classList.add('hidden');
    gameFrame.src='';
});

// ================= BACK BUTTONS =================
document.querySelectorAll('.back-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> showPage(btn.dataset.back));
});

// ================= BOTTOM NAV =================
document.querySelectorAll('.bottom-nav button').forEach(btn=>{
    btn.addEventListener('click', ()=> showPage(btn.dataset.nav));
});

// ================= INIT =================
renderTransactions();
renderCharts();
updateStreak();
renderGames();
