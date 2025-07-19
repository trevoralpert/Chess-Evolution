// Lobby System for EvoChess
// Handles multiplayer lobby management, creation, joining, and settings

// Lobby data storage
let lobbies = [];
let currentLobby = null;

/**
 * Show lobby UI
 */
function showLobbyUI() {
  const lobbyUI = document.getElementById('lobby-ui');
  if (lobbyUI) {
    lobbyUI.style.display = 'block';
    refreshLobbies();
  }
}

/**
 * Hide lobby UI
 */
function hideLobbyUI() {
  const lobbyUI = document.getElementById('lobby-ui');
  const lobbyBrowser = document.getElementById('lobby-browser');
  const lobbyCreation = document.getElementById('lobby-creation');
  const lobbyRoom = document.getElementById('lobby-room');
  
  if (lobbyUI) lobbyUI.style.display = 'none';
  if (lobbyBrowser) lobbyBrowser.style.display = 'block';
  if (lobbyCreation) lobbyCreation.style.display = 'none';
  if (lobbyRoom) lobbyRoom.style.display = 'none';
}

/**
 * Show lobby creation form
 */
function showLobbyCreation() {
  const lobbyBrowser = document.getElementById('lobby-browser');
  const lobbyCreation = document.getElementById('lobby-creation');
  const lobbyRoom = document.getElementById('lobby-room');
  
  if (lobbyBrowser) lobbyBrowser.style.display = 'none';
  if (lobbyCreation) lobbyCreation.style.display = 'block';
  if (lobbyRoom) lobbyRoom.style.display = 'none';
  
  // Set default lobby name
  const lobbyNameInput = document.getElementById('lobby-name');
  if (lobbyNameInput) {
    const playerName = typeof getPlayerName === 'function' ? getPlayerName() : 'Player';
    lobbyNameInput.value = `${playerName}'s Lobby`;
  }
}

/**
 * Hide lobby creation form
 */
function hideLobbyCreation() {
  const lobbyBrowser = document.getElementById('lobby-browser');
  const lobbyCreation = document.getElementById('lobby-creation');
  const lobbyRoom = document.getElementById('lobby-room');
  
  if (lobbyBrowser) lobbyBrowser.style.display = 'block';
  if (lobbyCreation) lobbyCreation.style.display = 'none';
  if (lobbyRoom) lobbyRoom.style.display = 'none';
}

/**
 * Show lobby room
 * @param {Object} lobby - Lobby data
 */
function showLobbyRoom(lobby) {
  const lobbyBrowser = document.getElementById('lobby-browser');
  const lobbyCreation = document.getElementById('lobby-creation');
  const lobbyRoom = document.getElementById('lobby-room');
  
  if (lobbyBrowser) lobbyBrowser.style.display = 'none';
  if (lobbyCreation) lobbyCreation.style.display = 'none';
  if (lobbyRoom) lobbyRoom.style.display = 'block';
  
  // Store current lobby
  currentLobby = lobby;
  
  updateLobbyRoomDisplay(lobby);
}

/**
 * Update lobby room display
 * @param {Object} lobby - Lobby data
 */
function updateLobbyRoomDisplay(lobby) {
  if (!lobby) return;
  
  // Update lobby name
  const lobbyRoomName = document.getElementById('lobby-room-name');
  if (lobbyRoomName) {
    lobbyRoomName.textContent = lobby.name || 'Unnamed Lobby';
  }
  
  // Update players list
  const playersListEl = document.getElementById('lobby-players-list');
  if (playersListEl && lobby.players) {
    const playersHtml = lobby.players.map(p => 
      `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
        <span>${p.name || 'Unknown Player'}${p.isCreator ? ' (Creator)' : ''}</span>
        <span style="color: ${p.ready ? '#00ff00' : '#ff6600'};">${p.ready ? 'Ready' : 'Not Ready'}</span>
      </div>`
    ).join('');
    playersListEl.innerHTML = playersHtml;
  }
  
  // Update settings display
  const settingsDisplayEl = document.getElementById('lobby-settings-display');
  if (settingsDisplayEl && lobby.settings) {
    const settingsHtml = `
      <div>Max Players: ${lobby.settings.maxPlayers || 'N/A'}</div>
      <div>Game Mode: ${lobby.settings.gameMode || 'Classic'}</div>
      <div>Time Limit: ${lobby.settings.timeLimit || 300}s</div>
      <div>Evolution Mode: ${lobby.settings.evolutionMode || 'Standard'}</div>
    `;
    settingsDisplayEl.innerHTML = settingsHtml;
  }
  
  // Update ready button and status
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket && lobby.players) {
    const currentPlayer = lobby.players.find(p => p.id === socket.id);
    if (currentPlayer) {
      const readyBtn = document.getElementById('ready-toggle-btn');
      const readyStatus = document.getElementById('ready-status');
      
      if (readyBtn) {
        if (currentPlayer.ready) {
          readyBtn.textContent = 'Not Ready';
          readyBtn.style.background = '#cc0000';
        } else {
          readyBtn.textContent = 'Ready';
          readyBtn.style.background = '#00cc00';
        }
      }
      
      if (readyStatus) {
        if (currentPlayer.ready) {
          readyStatus.textContent = 'Ready';
          readyStatus.style.color = '#00ff00';
        } else {
          readyStatus.textContent = 'Not Ready';
          readyStatus.style.color = '#ff6600';
        }
      }
    }
  }
}

/**
 * Create a new lobby
 */
function createLobby() {
  const nameInput = document.getElementById('lobby-name');
  const maxPlayersInput = document.getElementById('lobby-max-players');
  const gameModeInput = document.getElementById('lobby-game-mode');
  const timeLimitInput = document.getElementById('lobby-time-limit');
  
  const name = nameInput ? nameInput.value.trim() : '';
  const maxPlayers = maxPlayersInput ? parseInt(maxPlayersInput.value) : 4;
  const gameMode = gameModeInput ? gameModeInput.value : 'classic';
  const timeLimit = timeLimitInput ? parseInt(timeLimitInput.value) : 300;
  
  if (!name) {
    if (typeof showNotification === 'function') {
      showNotification('Please enter a lobby name', 'error');
    } else {
      alert('Please enter a lobby name');
    }
    return;
  }
  
  const settings = {
    name: name,
    maxPlayers: maxPlayers,
    gameMode: gameMode,
    timeLimit: timeLimit,
    evolutionMode: 'standard'
  };
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('create-lobby', { name, settings });
  }
}

/**
 * Join a lobby
 * @param {string} lobbyId - Lobby ID to join
 */
function joinLobby(lobbyId) {
  if (!lobbyId) return;
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('join-lobby', { lobbyId });
  }
}

/**
 * Leave current lobby
 */
function leaveLobby() {
  if (currentLobby) {
    const socket = typeof getSocket === 'function' ? getSocket() : 
                  (typeof window !== 'undefined' ? window.socket : null);
    
    if (socket) {
      socket.emit('leave-lobby', { lobbyId: currentLobby.id });
    }
    
    // Clear current lobby
    currentLobby = null;
  }
}

/**
 * Toggle ready status in current lobby
 */
function toggleReady() {
  if (currentLobby) {
    const socket = typeof getSocket === 'function' ? getSocket() : 
                  (typeof window !== 'undefined' ? window.socket : null);
    
    if (socket) {
      socket.emit('toggle-ready', { lobbyId: currentLobby.id });
    }
  }
}

/**
 * Refresh lobbies list
 */
function refreshLobbies() {
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('get-lobbies');
  }
}

/**
 * Update lobby list display
 * @param {Array} newLobbies - Array of lobby data
 */
function updateLobbyList(newLobbies) {
  lobbies = newLobbies || [];
  
  const lobbyListEl = document.getElementById('lobby-list');
  if (!lobbyListEl) return;
  
  if (lobbies.length === 0) {
    lobbyListEl.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No lobbies available. Create one to get started!</div>';
    return;
  }
  
  const lobbiesHtml = lobbies.map(lobby => `
    <div style="
      background: rgba(255, 255, 255, 0.1);
      margin: 5px 0;
      padding: 10px;
      border-radius: 5px;
      border-left: 3px solid #cc00cc;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <h4 style="margin: 0; color: #cc00cc;">${lobby.name}</h4>
        <span style="color: ${lobby.players.length >= lobby.settings.maxPlayers ? '#ff6600' : '#00ff00'};">
          ${lobby.players.length}/${lobby.settings.maxPlayers}
        </span>
      </div>
      <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">
        Mode: ${lobby.settings.gameMode} | Time: ${lobby.settings.timeLimit}s
      </div>
      <div style="font-size: 11px; color: #aaa; margin-bottom: 8px;">
        Players: ${lobby.players.map(p => p.name).join(', ')}
      </div>
      <button 
        onclick="joinLobby('${lobby.id}')"
        style="
          background: ${lobby.players.length >= lobby.settings.maxPlayers ? '#666' : '#4CAF50'};
          color: white;
          border: none;
          padding: 5px 15px;
          border-radius: 3px;
          cursor: ${lobby.players.length >= lobby.settings.maxPlayers ? 'not-allowed' : 'pointer'};
          font-size: 12px;
        "
        ${lobby.players.length >= lobby.settings.maxPlayers ? 'disabled' : ''}
      >
        ${lobby.players.length >= lobby.settings.maxPlayers ? 'Full' : 'Join'}
      </button>
    </div>
  `).join('');
  
  lobbyListEl.innerHTML = lobbiesHtml;
}

/**
 * Handle lobby joined event
 * @param {Object} lobby - Joined lobby data
 */
function handleLobbyJoined(lobby) {
  console.log('Joined lobby:', lobby);
  currentLobby = lobby;
  showLobbyRoom(lobby);
  
  if (typeof showNotification === 'function') {
    showNotification(`Joined lobby: ${lobby.name}`, 'success');
  }
}

/**
 * Handle lobby left event
 */
function handleLobbyLeft() {
  console.log('Left lobby');
  currentLobby = null;
  hideLobbyCreation();
  
  if (typeof showNotification === 'function') {
    showNotification('Left lobby', 'info');
  }
}

/**
 * Handle lobby updated event
 * @param {Object} lobby - Updated lobby data
 */
function handleLobbyUpdated(lobby) {
  console.log('Lobby updated:', lobby);
  
  if (currentLobby && currentLobby.id === lobby.id) {
    currentLobby = lobby;
    updateLobbyRoomDisplay(lobby);
  }
}

/**
 * Handle lobby creation result
 * @param {Object} result - Creation result
 */
function handleLobbyCreated(result) {
  console.log('Lobby created:', result);
  
  if (result.success) {
    currentLobby = result.lobby;
    showLobbyRoom(result.lobby);
    
    if (typeof showNotification === 'function') {
      showNotification(`Created lobby: ${result.lobby.name}`, 'success');
    }
  } else {
    if (typeof showNotification === 'function') {
      showNotification(`Failed to create lobby: ${result.error}`, 'error');
    } else {
      alert(`Failed to create lobby: ${result.error}`);
    }
  }
}

/**
 * Handle game start from lobby
 * @param {Object} gameData - Game start data
 */
function handleGameStartFromLobby(gameData) {
  console.log('Game starting from lobby:', gameData);
  
  // Hide lobby UI when game starts
  hideLobbyUI();
  
  if (typeof showNotification === 'function') {
    showNotification('Game starting!', 'success');
  }
  
  // Clear current lobby since game is starting
  currentLobby = null;
}

/**
 * Setup lobby socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupLobbySocketHandlers(socket) {
  if (!socket) return;
  
  socket.on('lobbies', (data) => {
    console.log('Lobbies received:', data);
    updateLobbyList(data.lobbies);
  });
  
  socket.on('lobby-created', (data) => {
    console.log('Lobby created:', data);
    handleLobbyCreated(data);
  });
  
  socket.on('lobby-joined', (data) => {
    console.log('Lobby joined:', data);
    handleLobbyJoined(data.lobby);
  });
  
  socket.on('lobby-left', (data) => {
    console.log('Lobby left:', data);
    handleLobbyLeft();
  });
  
  socket.on('lobby-updated', (data) => {
    console.log('Lobby updated:', data);
    handleLobbyUpdated(data.lobby);
  });
  
  socket.on('lobby-player-joined', (data) => {
    console.log('Player joined lobby:', data);
    if (currentLobby && currentLobby.id === data.lobbyId) {
      // Refresh lobby data
      refreshLobbies();
    }
    
    if (typeof showNotification === 'function') {
      showNotification(`${data.playerName} joined the lobby`, 'info');
    }
  });
  
  socket.on('lobby-player-left', (data) => {
    console.log('Player left lobby:', data);
    if (currentLobby && currentLobby.id === data.lobbyId) {
      // Refresh lobby data
      refreshLobbies();
    }
    
    if (typeof showNotification === 'function') {
      showNotification(`${data.playerName} left the lobby`, 'info');
    }
  });
  
  socket.on('lobby-game-starting', (data) => {
    console.log('Game starting from lobby:', data);
    handleGameStartFromLobby(data);
  });
  
  socket.on('lobby-error', (data) => {
    console.error('Lobby error:', data);
    if (typeof showNotification === 'function') {
      showNotification(`Lobby error: ${data.message}`, 'error');
    } else {
      alert(`Lobby error: ${data.message}`);
    }
  });
}

/**
 * Get current lobby
 * @returns {Object|null} Current lobby data
 */
function getCurrentLobby() {
  return currentLobby;
}

/**
 * Get all lobbies
 * @returns {Array} All lobbies data
 */
function getLobbies() {
  return lobbies;
}

/**
 * Set lobbies data
 * @param {Array} newLobbies - New lobbies data
 */
function setLobbies(newLobbies) {
  lobbies = newLobbies || [];
  updateLobbyList(lobbies);
}

/**
 * Clear current lobby
 */
function clearCurrentLobby() {
  currentLobby = null;
}

/**
 * Initialize lobby system
 */
function initializeLobbySystem() {
  console.log('🏠 Initializing Lobby System');
  
  // Make joinLobby function globally accessible for onclick handlers
  if (typeof window !== 'undefined') {
    window.joinLobby = joinLobby;
  }
  
  console.log('✅ Lobby System initialized');
}

/**
 * Get lobby statistics
 * @returns {Object} Lobby statistics
 */
function getLobbyStats() {
  return {
    totalLobbies: lobbies.length,
    currentLobby: currentLobby ? currentLobby.name : null,
    isInLobby: !!currentLobby
  };
}

export {
  // UI Management
  showLobbyUI,
  hideLobbyUI,
  showLobbyCreation,
  hideLobbyCreation,
  showLobbyRoom,
  updateLobbyRoomDisplay,
  
  // Lobby Actions
  createLobby,
  joinLobby,
  leaveLobby,
  toggleReady,
  refreshLobbies,
  
  // Data Management
  updateLobbyList,
  getCurrentLobby,
  getLobbies,
  setLobbies,
  clearCurrentLobby,
  
  // Event Handlers
  handleLobbyJoined,
  handleLobbyLeft,
  handleLobbyUpdated,
  handleLobbyCreated,
  handleGameStartFromLobby,
  
  // Socket Handlers
  setupLobbySocketHandlers,
  
  // System Management
  initializeLobbySystem,
  getLobbyStats
};