// ============================================
// PUSH-UP PRO - Simple & Clean
// ============================================

var AI_TRAINERS = [
    { id: 'arnold', name: 'Arnold', avatar: '🏋️', specialty: 'Muskelaufbau', color: '#ef4444', quote: 'Weiche nie!' },
    { id: 'rocky', name: 'Rocky', avatar: '🥊', specialty: 'Ausdauer', color: '#f59e0b', quote: 'Es geht nicht darum, wie hart du schlaegst.' },
    { id: 'mike', name: 'Mike', avatar: '💪', specialty: 'Technik', color: '#10b981', quote: 'Erst denken, dann trainieren.' },
    { id: 'camille', name: 'Camille', avatar: '🧘', specialty: 'Balance', color: '#3b82f6', quote: 'Balance ist der Schluessel.' },
    { id: 'zilla', name: 'Godzilla', avatar: '🦖', specialty: 'Kraft', color: '#10b981', quote: 'BREATH FIRE!' }
];

var currentUser = null;
var authMode = 'login';

function getDB() {
    return JSON.parse(localStorage.getItem('pushup_pro_db') || '{}');
}

function saveDB(db) {
    localStorage.setItem('pushup_pro_db', JSON.stringify(db));
}

function getUserData(username) {
    var db = getDB();
    if (!db[username]) {
        db[username] = {
            password: null,
            createdAt: new Date().toISOString(),
            day: 1,
            streak: 0,
            streakOnIce: false,
            history: [],
            completedToday: false,
            ai: null
        };
        saveDB(db);
    }
    return db[username];
}

function saveUserData(username, data) {
    var db = getDB();
    db[username] = data;
    saveDB(db);
}

document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUser();
});

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    document.getElementById('authToggleText').textContent = authMode === 'login' ? 'Noch kein Account?' : 'Schon registriert?';
    document.getElementById('authToggleLink').textContent = authMode === 'login' ? 'Registrieren' : 'Anmelden';
    document.getElementById('authBtn').textContent = authMode === 'login' ? 'Anmelden' : 'Registrieren';
}

function handleAuth() {
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    
    if (!username || !password) {
        showToast('Bitte ausfuellen!', 'error');
        return;
    }
    
    var db = getDB();
    
    if (authMode === 'register') {
        if (db[username]) {
            showToast('Benutzername vergeben!', 'error');
            return;
        }
        var userData = getUserData(username);
        userData.password = password;
        saveUserData(username, userData);
        currentUser = userData;
        localStorage.setItem('pushup_currentUser', username);
        showToast('Willkommen, ' + username + '!', 'success');
    } else {
        if (!db[username] || db[username].password !== password) {
            showToast('Falsches Passwort!', 'error');
            return;
        }
        currentUser = db[username];
        localStorage.setItem('pushup_currentUser', username);
        showToast('Willkommen zurueck!', 'success');
    }
    
    checkNewDay();
    showApp();
}

function loadCurrentUser() {
    var username = localStorage.getItem('pushup_currentUser');
    if (username) {
        var db = getDB();
        if (db[username]) {
            currentUser = db[username];
            checkNewDay();
            showApp();
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('pushup_currentUser');
    document.getElementById('app').classList.remove('active');
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').classList.add('active');
    var username = localStorage.getItem('pushup_currentUser');
    document.getElementById('userAvatar').textContent = username ? username.charAt(0).toUpperCase() : 'P';
    updateUI();
    renderAITrainers();
}

function checkNewDay() {
    if (!currentUser) return;
    var today = new Date().toDateString();
    var lastDate = currentUser.lastDate;
    if (lastDate && lastDate !== today) {
        currentUser.day++;
        currentUser.streakOnIce = true;
        currentUser.completedToday = false;
        saveCurrentUser();
    }
    currentUser.lastDate = today;
    saveCurrentUser();
}

function getTodayTarget() {
    return currentUser ? currentUser.day : 1;
}

function saveCurrentUser() {
    var username = localStorage.getItem('pushup_currentUser');
    if (username && currentUser) {
        saveUserData(username, currentUser);
    }
}

function completeToday() {
    if (!currentUser) {
        showToast('Bitte anmelden!', 'error');
        return;
    }
    if (currentUser.completedToday) {
        showToast('Heute schon erledigt!', 'warning');
        return;
    }
    var target = getTodayTarget();
    currentUser.history.push({
        date: new Date().toISOString(),
        count: target,
        day: currentUser.day
    });
    currentUser.completedToday = true;
    if (currentUser.streakOnIce) {
        currentUser.streak++;
        currentUser.streakOnIce = false;
    } else {
        currentUser.streak++;
    }
    saveCurrentUser();
    updateUI();
    showToast('🔥 ' + target + ' Liegestuetz! Streak: ' + currentUser.streak, 'success');
}

function updateUI() {
    if (!currentUser) return;
    var target = getTodayTarget();
    document.getElementById('todayTarget').textContent = target;
    document.getElementById('statToday').textContent = target;
    document.getElementById('statDays').textContent = currentUser.history.length;
    document.getElementById('statTotal').textContent = calculateTotalPushups();
    document.getElementById('statMax').textContent = calculateMaxPushups();
    document.getElementById('currentStreak').textContent = currentUser.streak;
    document.getElementById('streakCount').textContent = currentUser.streak;
    document.getElementById('totalDays').textContent = 'Tag ' + currentUser.day;
    document.getElementById('completeBtn').disabled = currentUser.completedToday;
    
    var streakBadge = document.getElementById('streakBadge');
    if (currentUser.streakOnIce) {
        streakBadge.className = 'streak-badge ice';
        streakBadge.innerHTML = '<span>🧊</span> Streak auf Eis';
    } else {
        streakBadge.className = 'streak-badge fire';
        streakBadge.innerHTML = '<span>🔥</span> <span id="streakCount">' + currentUser.streak + '</span> Tage';
    }
    renderChart();
}

function calculateTotalPushups() {
    if (!currentUser.history || currentUser.history.length === 0) return 0;
    return currentUser.history.reduce(function(sum, h) { return sum + h.count; }, 0);
}

function calculateMaxPushups() {
    if (!currentUser.history || currentUser.history.length === 0) return 0;
    return Math.max.apply(null, currentUser.history.map(function(h) { return h.count; }));
}

function renderChart() {
    if (!currentUser) return;
    var container = document.getElementById('chartContainer');
    var recent = currentUser.history.slice(-14);
    if (recent.length === 0) {
        container.innerHTML = '';
        return;
    }
    var max = Math.max.apply(null, recent.map(function(h) { return h.count; }), 10);
    var today = new Date().toDateString();
    container.innerHTML = recent.map(function(h) {
        var date = new Date(h.date);
        var height = (h.count / max) * 100;
        var isToday = date.toDateString() === today && currentUser.completedToday;
        return '<div class="chart-bar' + (isToday ? ' today' : '') + '" style="height: ' + height + '%"></div>';
    }).join('');
}

function renderAITrainers() {
    if (!currentUser) return;
    var container = document.getElementById('aiTrainers');
    container.innerHTML = AI_TRAINERS.map(function(t) {
        var isSelected = currentUser.ai === t.id;
        return '<div class="ai-trainer' + (isSelected ? ' selected' : '') + '" onclick="selectAI(\'' + t.id + '\')" style="border-color: ' + (isSelected ? t.color : '#222') + '; background: ' + (isSelected ? t.color + '20' : '#0a0a0a') + '">' +
            '<div class="avatar" style="background: ' + t.color + '">' + t.avatar + '</div>' +
            '<div class="name">' + t.name + '</div>' +
            '<div class="specialty">' + t.specialty + '</div>' +
            '<div class="quote">"' + t.quote + '"</div>' +
            '</div>';
    }).join('');
}

function selectAI(id) {
    if (!currentUser) {
        showToast('Bitte anmelden!', 'error');
        return;
    }
    currentUser.ai = id;
    saveCurrentUser();
    renderAITrainers();
    var trainer = AI_TRAINERS.find(function(t) { return t.id === id; });
    showToast(trainer.name + ' ist jetzt dein Coach!', 'success');
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) btn.classList.add('active');
    });
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}
