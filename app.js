/**
 * PUSH-UP PRO - Professional Push-Up Tracker
 * ==========================================
 * Features: Auth, Training, AI Coach, Body Stats, Friends, Photos
 * Storage: localStorage with per-user isolation
 */

// ============================================
// CONFIGURATION
// ============================================

var AI_TRAINERS = [
    { 
        id: 'arnold', 
        name: 'Arnold', 
        avatar: '🏋️', 
        specialty: 'Muskelaufbau', 
        color: '#ef4444', 
        quote: 'Weiche nie!',
        message: 'Weiche nie! Ein echter Kaempfer gibt niemals auf!'
    },
    { 
        id: 'rocky', 
        name: 'Rocky', 
        avatar: '🥊', 
        specialty: 'Ausdauer', 
        color: '#f59e0b', 
        quote: 'Es geht nicht darum, wie hart du schlaegst.',
        message: 'Es geht nicht darum, wie hart du schlaegst - sondern wie hart du AUFTRIST!'
    },
    { 
        id: 'mike', 
        name: 'Mike', 
        avatar: '💪', 
        specialty: 'Technik', 
        color: '#10b981', 
        quote: 'Erst denken, dann trainieren.',
        message: 'Erst denken, dann trainieren. Form ist alles!'
    },
    { 
        id: 'camille', 
        name: 'Camille', 
        avatar: '🧘', 
        specialty: 'Balance', 
        color: '#3b82f6', 
        quote: 'Balance ist der Schluessel.',
        message: 'Balance ist der Schluessel. Hoere auf deinen Koerper!'
    },
    { 
        id: 'zilla', 
        name: 'Godzilla', 
        avatar: '🦖', 
        specialty: 'Kraft', 
        color: '#10b981', 
        quote: 'BREATH FIRE!',
        message: 'BREATH FIRE! Zeig der Welt deine Kraft!'
    }
];

// ============================================
// GLOBAL STATE
// ============================================

var currentUser = null;
var authMode = 'login';
var cameraStream = null;

// ============================================
// DATABASE LAYER (Per-User Isolation)
// ============================================

function getDB() {
    var data = localStorage.getItem('pushup_pro_db');
    return data ? JSON.parse(data) : {};
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
            lastDate: null,
            day: 1,
            streak: 0,
            streakOnIce: false,
            history: [],
            completedToday: false,
            ai: null,
            bodyStats: [],
            photos: [],
            friends: []
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

function saveCurrentUser() {
    var username = localStorage.getItem('pushup_currentUser');
    if (username && currentUser) {
        saveUserData(username, currentUser);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUser();
});

// ============================================
// AUTHENTICATION
// ============================================

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
        showToast('Bitte Benutzername und Passwort eingeben!', 'error');
        return;
    }
    
    if (username.length < 3) {
        showToast('Benutzername muss mindestens 3 Zeichen haben!', 'error');
        return;
    }
    
    var db = getDB();
    
    if (authMode === 'register') {
        if (db[username]) {
            showToast('Benutzername bereits vergeben!', 'error');
            return;
        }
        var userData = getUserData(username);
        userData.password = password;
        saveUserData(username, userData);
        currentUser = userData;
        localStorage.setItem('pushup_currentUser', username);
        showToast('Willkommen bei Push-Up Pro, ' + username + '!', 'success');
    } else {
        if (!db[username] || db[username].password !== password) {
            showToast('Falscher Benutzername oder Passwort!', 'error');
            return;
        }
        currentUser = db[username];
        localStorage.setItem('pushup_currentUser', username);
        showToast('Willkommen zurueck, ' + username + '!', 'success');
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

// ============================================
// APP UI
// ============================================

function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').classList.add('active');
    
    var username = localStorage.getItem('pushup_currentUser');
    document.getElementById('userAvatar').textContent = username ? username.charAt(0).toUpperCase() : 'P';
    
    updateUI();
    renderAll();
}

// ============================================
// DAY TRACKING
// ============================================

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

// ============================================
// WORKOUT COMPLETION
// ============================================

function completeToday() {
    if (!currentUser) {
        showToast('Bitte anmelden!', 'error');
        return;
    }
    
    if (currentUser.completedToday) {
        showToast('Heute schon erledigt! Komm morgen wieder.', 'warning');
        return;
    }
    
    var target = getTodayTarget();
    var trainer = currentUser.ai ? AI_TRAINERS.find(function(t) { return t.id === currentUser.ai; }) : null;
    
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
    
    var message = '🔥 ' + target + ' Liegestuetz erledigt! Streak: ' + currentUser.streak;
    if (trainer) {
        message += ' | ' + trainer.name + ': "' + trainer.message + '"';
    }
    showToast(message, 'success');
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    if (!currentUser) return;
    
    var target = getTodayTarget();
    var trainer = currentUser.ai ? AI_TRAINERS.find(function(t) { return t.id === currentUser.ai; }) : null;
    
    // Update stats
    document.getElementById('todayTarget').textContent = target;
    document.getElementById('statToday').textContent = target;
    document.getElementById('statDays').textContent = currentUser.history.length;
    document.getElementById('statTotal').textContent = calculateTotalPushups();
    document.getElementById('statMax').textContent = calculateMaxPushups();
    document.getElementById('currentStreak').textContent = currentUser.streak;
    document.getElementById('streakCount').textContent = currentUser.streak;
    document.getElementById('totalDays').textContent = 'Tag ' + currentUser.day;
    document.getElementById('completeBtn').disabled = currentUser.completedToday;
    
    // Update coach badge
    var coachBadge = document.getElementById('coachBadge');
    if (trainer) {
        coachBadge.innerHTML = trainer.avatar + ' ' + trainer.name;
        coachBadge.style.color = trainer.color;
        coachBadge.style.display = 'flex';
    } else {
        coachBadge.style.display = 'none';
    }
    
    // Update streak badge
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

function renderAll() {
    renderAITrainers();
    renderFriends();
    renderPhotos();
    updateAIAnalysis();
}

// ============================================
// CHARTS
// ============================================

function renderChart() {
    if (!currentUser) return;
    
    var container = document.getElementById('chartContainer');
    var recent = currentUser.history.slice(-14);
    
    if (recent.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">Noch keine Daten. Starte heute!</div>';
        return;
    }
    
    var max = Math.max.apply(null, recent.map(function(h) { return h.count; }), 10);
    var today = new Date().toDateString();
    
    container.innerHTML = recent.map(function(h) {
        var date = new Date(h.date);
        var height = (h.count / max) * 100;
        var isToday = date.toDateString() === today && currentUser.completedToday;
        return '<div class="chart-bar' + (isToday ? ' today' : '') + '" style="height: ' + height + '%" title="' + date.toLocaleDateString() + ': ' + h.count + ' LP"></div>';
    }).join('');
}

// ============================================
// AI TRAINERS
// ============================================

function renderAITrainers() {
    if (!currentUser) return;
    
    var container = document.getElementById('aiTrainers');
    var friendSelect = document.getElementById('friendAI');
    
    container.innerHTML = AI_TRAINERS.map(function(t) {
        var isSelected = currentUser.ai === t.id;
        return '<div class="ai-trainer' + (isSelected ? ' selected' : '') + '" onclick="selectAI(\'' + t.id + '\')" style="border-color: ' + (isSelected ? t.color : '#222') + '; background: ' + (isSelected ? t.color + '20' : '#0a0a0a') + '">' +
            '<div class="avatar" style="background: ' + t.color + '">' + t.avatar + '</div>' +
            '<div class="name">' + t.name + '</div>' +
            '<div class="specialty">' + t.specialty + '</div>' +
            '<div class="quote">"' + t.quote + '"</div>' +
            '</div>';
    }).join('');
    
    if (friendSelect) {
        friendSelect.innerHTML = '<option value="">-- Kein Coach --</option>' + 
            AI_TRAINERS.map(function(t) {
                return '<option value="' + t.id + '">' + t.avatar + ' ' + t.name + '</option>';
            }).join('');
    }
}

function selectAI(id) {
    if (!currentUser) {
        showToast('Bitte anmelden!', 'error');
        return;
    }
    
    currentUser.ai = id;
    saveCurrentUser();
    renderAITrainers();
    updateUI();
    
    var trainer = AI_TRAINERS.find(function(t) { return t.id === id; });
    showToast(trainer.name + ' ist jetzt dein Coach: "' + trainer.message + '"', 'success');
}

// ============================================
// FRIENDS (Per-User)
// ============================================

function renderFriends() {
    if (!currentUser) return;
    
    var container = document.getElementById('friendsList');
    var friends = currentUser.friends || [];
    
    if (friends.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">👥</div><p>Noch keine Freunde</p><p style="font-size: 12px; color: #666;">Freunde sind nur fuer dich sichtbar!</p></div>';
        return;
    }
    
    container.innerHTML = friends.map(function(f) {
        var ai = f.ai ? AI_TRAINERS.find(function(t) { return t.id === f.ai; }) : null;
        return '<div class="friend-item">' +
            '<div class="friend-avatar">' + f.avatar + '</div>' +
            '<div class="friend-info">' +
            '<div class="friend-name">' + f.username + (ai ? ' <span>' + ai.avatar + '</span>' : '') + '</div>' +
            '<div class="friend-stats">🔥 <span>' + f.streak + '</span> • Heute: <span>' + f.today + '</span> • Gesamt: <span>' + f.total + '</span></div>' +
            '</div>' +
            '<button class="friend-action-btn" onclick="removeFriend(\'' + f.id + '\')">🗑️</button>' +
            '</div>';
    }).join('');
}

function openFriendModal() {
    if (!currentUser) {
        showToast('Bitte anmelden!', 'error');
        return;
    }
    document.getElementById('friendModal').classList.add('active');
}

function closeFriendModal() {
    document.getElementById('friendModal').classList.remove('active');
    document.getElementById('friendUsername').value = '';
}

function confirmAddFriend() {
    if (!currentUser) return;
    
    var name = document.getElementById('friendUsername').value.trim();
    var ai = document.getElementById('friendAI').value;
    
    if (!name) {
        showToast('Name eingeben!', 'error');
        return;
    }
    
    if (!currentUser.friends) {
        currentUser.friends = [];
    }
    
    var exists = currentUser.friends.some(function(f) { return f.username.toLowerCase() === name.toLowerCase(); });
    if (exists) {
        showToast('Freund schon vorhanden!', 'error');
        return;
    }
    
    currentUser.friends.push({
        id: Date.now().toString(),
        username: name,
        avatar: name.charAt(0).toUpperCase(),
        ai: ai || null,
        streak: Math.floor(Math.random() * 20) + 1,
        today: Math.floor(Math.random() * 15) + 1,
        total: Math.floor(Math.random() * 500) + 50
    });
    
    saveCurrentUser();
    renderFriends();
    closeFriendModal();
    showToast(name + ' hinzugefuegt!', 'success');
}

function removeFriend(id) {
    if (!currentUser || !currentUser.friends) return;
    
    if (confirm('Freund entfernen?')) {
        currentUser.friends = currentUser.friends.filter(function(f) { return f.id !== id; });
        saveCurrentUser();
        renderFriends();
        showToast('Freund entfernt', 'success');
    }
}

// ============================================
// PHOTOS (Private - Only User Sees)
// ============================================

function renderPhotos() {
    if (!currentUser) return;
    
    var container = document.getElementById('photosGrid');
    var photos = currentUser.photos || [];
    
    if (photos.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📷</div><p>Noch keine Fotos</p><p style="font-size: 12px; color: #666;">Nur du kannst deine Fotos sehen!</p></div>';
        return;
    }
    
    var recent = photos.slice(-8).reverse();
    container.innerHTML = recent.map(function(p, i) {
        var actualIndex = photos.length - 1 - i;
        return '<div class="photo-item">' +
            '<img src="' + p.image + '">' +
            '<div class="photo-overlay"><div class="photo-date">' + new Date(p.date).toLocaleDateString() + '</div></div>' +
            '<button class="photo-delete" onclick="deletePhoto(' + actualIndex + ')">×</button>' +
            '</div>';
    }).join('');
}

function deletePhoto(index) {
    if (!currentUser || !currentUser.photos) return;
    
    if (confirm('Foto loeschen?')) {
        currentUser.photos.splice(index, 1);
        saveCurrentUser();
        renderPhotos();
        showToast('Foto geloescht', 'success');
    }
}

async function openCamera() {
    if (!currentUser) {
        showToast('Bitte anmelden!', 'error');
        return;
    }
    
    var modal = document.getElementById('cameraModal');
    var video = document.getElementById('cameraVideo');
    
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
        });
        video.srcObject = cameraStream;
        modal.classList.add('active');
    } catch(err) {
        console.error('Camera error:', err);
        showToast('Kamera nicht verfuegbar!', 'error');
    }
}

function closeCamera() {
    document.getElementById('cameraModal').classList.remove('active');
    if (cameraStream) {
        cameraStream.getTracks().forEach(function(track) { track.stop(); });
        cameraStream = null;
    }
}

function takePhoto() {
    var video = document.getElementById('cameraVideo');
    
    var canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    if (!currentUser.photos) {
        currentUser.photos = [];
    }
    
    currentUser.photos.push({
        date: new Date().toISOString(),
        image: canvas.toDataURL('image/jpeg', 0.7)
    });
    
    saveCurrentUser();
    renderPhotos();
    closeCamera();
    showToast('Foto gespeichert!', 'success');
}

// ============================================
// BODY STATS
// ============================================

function saveBodyStats() {
    if (!currentUser) {
        showToast('Bitte anmelden!', 'error');
        return;
    }
    
    var weight = document.getElementById('bodyWeight').value;
    var waist = document.getElementById('bodyWaist').value;
    var arms = document.getElementById('bodyArms').value;
    var chest = document.getElementById('bodyChest').value;
    
    if (!weight && !waist && !arms && !chest) {
        showToast('Mindestens einen Wert eingeben!', 'error');
        return;
    }
    
    if (!currentUser.bodyStats) {
        currentUser.bodyStats = [];
    }
    
    currentUser.bodyStats.push({
        date: new Date().toISOString(),
        weight: parseFloat(weight) || null,
        waist: parseFloat(waist) || null,
        arms: parseFloat(arms) || null,
        chest: parseFloat(chest) || null
    });
    
    saveCurrentUser();
    updateAIAnalysis();
    showToast('Koerper-Masse gespeichert!', 'success');
}

function updateAIAnalysis() {
    if (!currentUser || !currentUser.bodyStats) {
        document.getElementById('aiAnalysisContent').textContent = 'Trage deine Masse ein fuer eine personalisierte Analyse.';
        return;
    }
    
    var stats = currentUser.bodyStats;
    
    if (stats.length < 2) {
        document.getElementById('aiAnalysisContent').textContent = 'Trage deine Masse ein fuer eine personalisierte Analyse.';
        return;
    }
    
    var current = stats[stats.length - 1];
    var previous = stats[stats.length - 2];
    var analysis = '';
    
    if (current.weight && previous.weight) {
        var diff = (current.weight - previous.weight).toFixed(1);
        analysis += diff < 0 ? 'Gewicht: ' + diff + ' kg (Top!) ' : 'Gewicht: +' + diff + ' kg. ';
    }
    
    if (current.waist && previous.waist) {
        var diff = (current.waist - previous.waist).toFixed(1);
        if (diff < 0) {
            analysis += 'Bauch: -' + diff + ' cm (Fortschritt!) ';
        }
    }
    
    analysis += 'Deine Liegestuetz-Trainings zeigen Wirkung! 💪';
    document.getElementById('aiAnalysisContent').textContent = analysis;
}

// ============================================
// NAVIGATION
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-content').forEach(function(tab) {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3500);
}
