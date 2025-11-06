const API_URL = '/api';

(function() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
})();

let allPlayers = [];
let currentUser = null;
let playerToRateId = null;
let playerToEditId = null;

function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type} active`;
    setTimeout(() => {
        messageBox.classList.remove('active');
    }, 4000);
}

function toggleView(isLoggedIn) {
    const appContainer = document.getElementById('app-container');
    const authContainer = document.getElementById('auth-container');
    
    if (isLoggedIn) {
        appContainer.classList.add('active');
        authContainer.classList.remove('active');
    } else {
        appContainer.classList.remove('active');
        authContainer.classList.add('active');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

async function handleAuth(endpoint, body) {
    try {
        showLoading();
        const data = await apiRequest(`/${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        currentUser = data.user;

        toggleView(true);
        await fetchPlayers();
        showMessage(`Welcome ${data.user.username}!`, 'success');

        if (endpoint === 'register') {
            document.getElementById('show-login-btn').click();
            document.getElementById('login-form').reset();
            document.getElementById('register-form').reset();
        }
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function fetchPlayers() {
    try {
        const players = await apiRequest('/players');
        
        allPlayers = players.map(player => ({
            ...player,
            avgRating: player.avgRating || 0,
            ratingCount: 0
        }));
        
        renderTable(allPlayers);
    } catch (error) {
        showMessage(error.message, 'error');
        if (error.message.includes('token') || error.message.includes('Unauthorized')) {
            logout();
        }
    }
}

function renderTable(players) {
    const tbody = document.getElementById('player-table-body');
    
    if (players.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div>No players found</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = players.map(player => {
        const isSelf = player.id === currentUser.id;
        const isAdmin = currentUser.role === 'admin';
        const canEdit = isSelf || isAdmin;
        const canDelete = isAdmin && !isSelf;
        const canRate = !isSelf;

        const statusClass = player.status === 'Ready' ? 'status-ready' : 'status-not-ready';
        const avatarUrl = player.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.player)}&background=random&size=48`;

        return `
            <tr>
                <td><img src="${avatarUrl}" alt="${player.player}" class="player-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.player)}&background=random&size=48'"></td>
                <td><strong>${player.player}</strong></td>
                <td>${capitalizeFirst(player.position)}</td>
                <td>${player.preferredFoot}</td>
                <td><span class="status-badge ${statusClass}">${player.status}</span></td>
                <td>${player.height}m</td>
                <td>
                    <div class="rating-display">
                        <span class="rating-star">⭐</span>
                        ${player.avgRating.toFixed(1)}
                    </div>
                </td>
                <td class="action-buttons">
                    <button class="rate-btn" data-id="${player.id}" data-name="${player.player}" ${canRate ? '' : 'disabled'}>
                        ${canRate ? 'Rate' : '—'}
                    </button>
                    <button class="edit-btn" data-id="${player.id}" ${canEdit ? '' : 'disabled'}>
                        ${isSelf ? 'Profile' : 'Edit'}
                    </button>
                    <button class="delete-btn" data-id="${player.id}" ${canDelete ? '' : 'disabled'}>Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleEdit(playerId) {
    playerToEditId = parseInt(playerId);
    const player = allPlayers.find(p => p.id === playerToEditId);
    if (!player) return;

    const isSelf = playerToEditId === currentUser.id;
    
    document.getElementById('edit-title').textContent = isSelf ? '✏️ Edit My Profile' : `✏️ Edit ${player.player}`;
    document.getElementById('edit-playerName').value = player.player;
    document.getElementById('edit-height').value = player.height;
    document.getElementById('edit-position').value = player.position;
    document.getElementById('edit-preferredFoot').value = player.preferredFoot;
    document.getElementById('edit-status').value = player.status;
    document.getElementById('edit-profilePicUrl').value = player.profilePicUrl || '';

    const adminRoleGroup = document.getElementById('edit-admin-role-group');
    if (currentUser.role === 'admin' && !isSelf) {
        adminRoleGroup.style.display = 'block';
        document.getElementById('edit-role').value = player.role;
    } else {
        adminRoleGroup.style.display = 'none';
    }

    openModal('edit-modal');
}

async function submitEdit(formData) {
    try {
        showLoading();
        const data = Object.fromEntries(formData.entries());
        data.height = parseFloat(data.height);
        
        if (!data.profilePicUrl) {
            delete data.profilePicUrl;
        }
        
        if (currentUser.role !== 'admin' || playerToEditId === currentUser.id) {
            delete data.role;
        }

        const endpoint = playerToEditId === currentUser.id ? '/players/me' : `/players/${playerToEditId}`;
        
        await apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (playerToEditId === currentUser.id) {
            const updatedUser = { ...currentUser, ...data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            currentUser = updatedUser;
        }

        await fetchPlayers();
        closeModal('edit-modal');
        showMessage('Profile updated successfully!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleDelete(playerId) {
    if (!confirm('⚠️ Are you sure you want to delete this player? This action cannot be undone.')) {
        return;
    }

    try {
        showLoading();
        await apiRequest(`/players/${playerId}`, { method: 'DELETE' });
        await fetchPlayers();
        showMessage('Player deleted successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRate(playerId, playerName) {
    playerToRateId = parseInt(playerId);
    document.getElementById('rate-player-name').textContent = playerName;
    document.getElementById('rate-rating').value = '';
    openModal('rate-modal');
}

async function submitRating(formData) {
    try {
        showLoading();
        const score = parseInt(formData.get('score'));
        
        await apiRequest(`/rate/${playerToRateId}`, {
            method: 'POST',
            body: JSON.stringify({ score })
        });

        await fetchPlayers();
        closeModal('rate-modal');
        showMessage('Rating submitted successfully!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function applyFilters(filters) {
    const filtered = allPlayers.filter(player => {
        const nameMatch = !filters.name || player.player.toLowerCase().includes(filters.name.toLowerCase());
        const positionMatch = !filters.position || player.position === filters.position;
        const statusMatch = !filters.status || player.status === filters.status;
        const footMatch = !filters.foot || player.preferredFoot === filters.foot;
        
        return nameMatch && positionMatch && statusMatch && footMatch;
    });
    
    renderTable(filtered);
}

function generateTeams() {
    const numTeams = parseInt(document.getElementById('num-teams').value);
    const playersPerTeam = parseInt(document.getElementById('players-per-team').value);
    const strategy = document.getElementById('team-strategy').value;

    const availablePlayers = allPlayers.filter(p => p.status === 'Ready');
    const totalPlayersNeeded = numTeams * playersPerTeam;

    if (availablePlayers.length < totalPlayersNeeded) {
        showMessage(`Not enough ready players. Need ${totalPlayersNeeded}, have ${availablePlayers.length}`, 'error');
        return;
    }

    let teams;
    if (strategy === 'balanced') {
        teams = generateBalancedTeams(availablePlayers, numTeams, playersPerTeam);
    } else {
        teams = generateRatedTeams(availablePlayers, numTeams, playersPerTeam);
    }

    if (teams) {
        displayTeams(teams);
        showMessage('Teams generated successfully!', 'success');
    }
}

function generateBalancedTeams(players, numTeams, playersPerTeam) {
    const positions = {
        attacker: players.filter(p => p.position === 'attacker'),
        midfielder: players.filter(p => p.position === 'midfielder'),
        defender: players.filter(p => p.position === 'defender'),
        goalkeeper: players.filter(p => p.position === 'goalkeeper')
    };

    Object.values(positions).forEach(arr => shuffleArray(arr));

    if (playersPerTeam < 3) {
        showMessage('Players per team must be at least 3', 'error');
        return null;
    }

    const teams = Array.from({ length: numTeams }, () => []);

    for (let i = 0; i < numTeams; i++) {
        if (positions.attacker.length > 0) teams[i].push(positions.attacker.pop());
        if (positions.midfielder.length > 0) teams[i].push(positions.midfielder.pop());
        if (positions.defender.length > 0) teams[i].push(positions.defender.pop());
    }

    const remaining = [...positions.attacker, ...positions.midfielder, ...positions.defender, ...positions.goalkeeper];
    shuffleArray(remaining);

    let teamIndex = 0;
    while (remaining.length > 0 && teams.some(t => t.length < playersPerTeam)) {
        if (teams[teamIndex].length < playersPerTeam) {
            teams[teamIndex].push(remaining.pop());
        }
        teamIndex = (teamIndex + 1) % numTeams;
    }

    return teams;
}

function generateRatedTeams(players, numTeams, playersPerTeam) {
    const sorted = [...players].sort((a, b) => b.avgRating - a.avgRating);
    const selected = sorted.slice(0, numTeams * playersPerTeam);
    const teams = Array.from({ length: numTeams }, () => []);

    let direction = 1;
    let teamIndex = 0;

    selected.forEach(player => {
        teams[teamIndex].push(player);
        teamIndex += direction;

        if (teamIndex === numTeams) {
            direction = -1;
            teamIndex = numTeams - 1;
        } else if (teamIndex === -1) {
            direction = 1;
            teamIndex = 0;
        }
    });

    return teams;
}

function displayTeams(teams) {
    const output = document.getElementById('teams-output');
    output.innerHTML = teams.map((team, index) => {
        const avgRating = (team.reduce((sum, p) => sum + p.avgRating, 0) / team.length).toFixed(1);
        const playersHtml = team.map(p => 
            `<li>${p.player} <small>(${capitalizeFirst(p.position)}, ⭐${p.avgRating.toFixed(1)})</small></li>`
        ).join('');

        return `
            <div class="team-card">
                <h3>🏆 Team ${index + 1} <small>(Avg: ${avgRating})</small></h3>
                <ul>${playersHtml}</ul>
            </div>
        `;
    }).join('');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    allPlayers = [];
    toggleView(false);
    showMessage('Logged out successfully', 'success');
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        toggleView(true);
        fetchPlayers();
    } else {
        toggleView(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (localStorage.getItem('theme') === 'dark') {
        themeBtn.textContent = '☀️';
    }
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeBtn.textContent = isDark ? '☀️' : '🌙';
    });

    document.getElementById('show-register-btn').addEventListener('click', () => {
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('register-view').style.display = 'block';
        document.getElementById('show-register-btn').classList.add('active');
        document.getElementById('show-login-btn').classList.remove('active');
    });

    document.getElementById('show-login-btn').addEventListener('click', () => {
        document.getElementById('register-view').style.display = 'none';
        document.getElementById('login-view').style.display = 'block';
        document.getElementById('show-login-btn').classList.add('active');
        document.getElementById('show-register-btn').classList.remove('active');
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        handleAuth('login', Object.fromEntries(formData));
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.height = parseFloat(data.height);
        if (!data.profilePicUrl) delete data.profilePicUrl;
        handleAuth('register', data);
    });

    document.getElementById('logout-btn').addEventListener('click', logout);

    document.getElementById('player-table-body').addEventListener('click', (e) => {
        const target = e.target;
        if (target.disabled) return;

        const id = target.dataset.id;
        
        if (target.classList.contains('rate-btn')) {
            handleRate(id, target.dataset.name);
        } else if (target.classList.contains('edit-btn')) {
            handleEdit(id);
        } else if (target.classList.contains('delete-btn')) {
            handleDelete(id);
        }
    });

    document.getElementById('edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitEdit(new FormData(e.target));
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        closeModal('edit-modal');
        document.getElementById('edit-form').reset();
    });

    document.getElementById('rate-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitRating(new FormData(e.target));
    });

    document.getElementById('cancel-rate-btn').addEventListener('click', () => {
        closeModal('rate-modal');
        document.getElementById('rate-form').reset();
    });

    document.getElementById('filter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        applyFilters(Object.fromEntries(formData));
    });

    document.getElementById('reset-filter-btn').addEventListener('click', () => {
        document.getElementById('filter-form').reset();
        renderTable(allPlayers);
    });

    document.getElementById('generate-teams-btn').addEventListener('click', generateTeams);

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    checkAuth();
});
