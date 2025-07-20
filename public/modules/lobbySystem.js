// Lobby System Module
// Functions for lobby creation, joining, management, and display

import { getElement, showElement, hideElement, setElementText, setElementHTML } from './uiReferences.js';
import { UI_ELEMENTS } from './gameConfig.js';

/**
 * Show lobby UI
 */
export function showLobbyUI() {
  console.log('🏛️ Showing lobby UI...');
  const lobbyUI = getElement('lobby-ui');
  if (lobbyUI) {
    showElement(lobbyUI);
  }
}

/**
 * Hide lobby UI
 */
export function hideLobbyUI() {
  console.log('🏛️ Hiding lobby UI...');
  const lobbyUI = getElement('lobby-ui');
  if (lobbyUI) {
    hideElement(lobbyUI);
  }
}

/**
 * Show lobby creation interface
 */
export function showLobbyCreation() {
  console.log('🏗️ Showing lobby creation...');
  const lobbyCreation = getElement('lobby-creation');
  const lobbyList = getElement('lobby-list');
  
  if (lobbyCreation) showElement(lobbyCreation);
  if (lobbyList) hideElement(lobbyList);
}

/**
 * Hide lobby creation interface
 */
export function hideLobbyCreation() {
  console.log('🏗️ Hiding lobby creation...');
  const lobbyCreation = getElement('lobby-creation');
  const lobbyList = getElement('lobby-list');
  
  if (lobbyCreation) hideElement(lobbyCreation);
  if (lobbyList) showElement(lobbyList);
}

/**
 * Show lobby room interface
 * @param {object} lobby - Lobby data
 */
export function showLobbyRoom(lobby) {
  console.log('🏠 Showing lobby room:', lobby);
  const lobbyRoom = getElement('lobby-room');
  if (lobbyRoom) {
    showElement(lobbyRoom);
    updateLobbyRoomDisplay(lobby);
  }
}

/**
 * Update lobby room display with current lobby data
 * @param {object} lobby - Lobby data
 */
export function updateLobbyRoomDisplay(lobby) {
  if (!lobby) {
    console.warn('⚠️ No lobby data provided for room display');
    return;
  }
  
  console.log('🔄 Updating lobby room display:', lobby);
  
  // Update lobby name
  const lobbyNameEl = getElement('lobby-room-name');
  if (lobbyNameEl) {
    setElementText(lobbyNameEl, lobby.name || 'Unnamed Lobby');
  }
  
  // Update player count
  const playerCountEl = getElement('lobby-player-count');
  if (playerCountEl) {
    const currentCount = lobby.players ? lobby.players.length : 0;
    const maxCount = lobby.maxPlayers || 8;
    setElementText(playerCountEl, `${currentCount}/${maxCount} players`);
  }
  
  // Update player list
  const playerListEl = getElement('lobby-player-list');
  if (playerListEl && lobby.players) {
    const playersHTML = lobby.players.map((player, index) => {
      const readyStatus = player.ready ? '✅' : '⏳';
      const hostIndicator = player.isHost ? '👑' : '';
      return `
        <div class="lobby-player" data-player-id="${player.id}">
          <span class="player-name">${hostIndicator} ${player.name}</span>
          <span class="player-status">${readyStatus}</span>
        </div>
      `;
    }).join('');
    
    setElementHTML(playerListEl, playersHTML);
  }
  
  // Update lobby settings
  const settingsEl = getElement('lobby-settings-display');
  if (settingsEl && lobby.settings) {
    const settingsHTML = formatLobbySettings(lobby.settings);
    setElementHTML(settingsEl, settingsHTML);
  }
  
  // Update ready button state
  const readyBtn = getElement('lobby-ready-btn');
  if (readyBtn && lobby.currentPlayer) {
    const isReady = lobby.currentPlayer.ready;
    readyBtn.textContent = isReady ? 'Not Ready' : 'Ready';
    readyBtn.className = `lobby-btn ${isReady ? 'ready' : 'not-ready'}`;
  }
  
  // Show/hide start game button for host
  const startBtn = getElement('lobby-start-btn');
  if (startBtn && lobby.currentPlayer) {
    if (lobby.currentPlayer.isHost) {
      showElement(startBtn);
      const allReady = lobby.players.every(p => p.ready);
      const minPlayers = lobby.players.length >= (lobby.minPlayers || 2);
      startBtn.disabled = !allReady || !minPlayers;
      startBtn.textContent = allReady && minPlayers ? 'Start Game' : 'Waiting for players...';
    } else {
      hideElement(startBtn);
    }
  }
}

/**
 * Format lobby settings for display
 * @param {object} settings - Lobby settings
 * @returns {string} HTML formatted settings
 */
export function formatLobbySettings(settings) {
  if (!settings) return '<p>No settings available</p>';
  
  let html = '<div class="lobby-settings">';
  
  if (settings.gameMode) {
    html += `<div class="setting-item">
      <span class="setting-label">Game Mode:</span>
      <span class="setting-value">${settings.gameMode}</span>
    </div>`;
  }
  
  if (settings.timeLimit) {
    html += `<div class="setting-item">
      <span class="setting-label">Time Limit:</span>
      <span class="setting-value">${settings.timeLimit}s per turn</span>
    </div>`;
  }
  
  if (settings.evolutionEnabled !== undefined) {
    html += `<div class="setting-item">
      <span class="setting-label">Evolution:</span>
      <span class="setting-value">${settings.evolutionEnabled ? 'Enabled' : 'Disabled'}</span>
    </div>`;
  }
  
  if (settings.spectatorMode !== undefined) {
    html += `<div class="setting-item">
      <span class="setting-label">Spectators:</span>
      <span class="setting-value">${settings.spectatorMode ? 'Allowed' : 'Not Allowed'}</span>
    </div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Create a new lobby
 * @param {object} dependencies - Required dependencies (socket)
 */
export function createLobby(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🏗️ Creating new lobby...');
  
  const lobbyNameInput = getElement('lobby-name-input');
  const maxPlayersInput = getElement('lobby-max-players');
  const gameModeSelect = getElement('lobby-game-mode');
  const timeLimitInput = getElement('lobby-time-limit');
  const evolutionCheckbox = getElement('lobby-evolution-enabled');
  const spectatorCheckbox = getElement('lobby-spectator-mode');
  
  const lobbyData = {
    name: lobbyNameInput?.value.trim() || 'New Lobby',
    maxPlayers: parseInt(maxPlayersInput?.value) || 8,
    gameMode: gameModeSelect?.value || 'standard',
    timeLimit: parseInt(timeLimitInput?.value) || 30,
    evolutionEnabled: evolutionCheckbox?.checked || true,
    spectatorMode: spectatorCheckbox?.checked || false
  };
  
  console.log('🏗️ Lobby data:', lobbyData);
  
  if (socket) {
    socket.emit('create-lobby', lobbyData);
  }
  
  // Hide creation form
  hideLobbyCreation();
}

/**
 * Join a lobby
 * @param {string} lobbyId - Lobby ID to join
 * @param {object} dependencies - Required dependencies (socket)
 */
export function joinLobby(lobbyId, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🚪 Joining lobby:', lobbyId);
  
  if (socket && lobbyId) {
    socket.emit('join-lobby', { lobbyId });
  }
}

/**
 * Leave current lobby
 * @param {object} dependencies - Required dependencies (socket)
 */
export function leaveLobby(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🚪 Leaving lobby...');
  
  if (socket) {
    socket.emit('leave-lobby');
  }
  
  // Hide lobby room and show lobby list
  const lobbyRoom = getElement('lobby-room');
  if (lobbyRoom) hideElement(lobbyRoom);
  
  showLobbyUI();
}

/**
 * Toggle ready state
 * @param {object} dependencies - Required dependencies (socket)
 */
export function toggleReady(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔄 Toggling ready state...');
  
  if (socket) {
    socket.emit('toggle-ready');
  }
}

/**
 * Refresh lobby list
 * @param {object} dependencies - Required dependencies (socket)
 */
export function refreshLobbies(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔄 Refreshing lobby list...');
  
  if (socket) {
    socket.emit('get-lobby-list');
  }
}

/**
 * Update lobby list display
 * @param {Array} lobbies - Array of lobby objects
 */
export function updateLobbyList(lobbies) {
  console.log('📋 Updating lobby list:', lobbies);
  
  const lobbyListEl = getElement('lobby-list-container');
  if (!lobbyListEl) {
    console.warn('⚠️ Lobby list container not found');
    return;
  }
  
  if (!lobbies || lobbies.length === 0) {
    setElementHTML(lobbyListEl, '<p class="no-lobbies">No lobbies available. Create one!</p>');
    return;
  }
  
  const lobbiesHTML = lobbies.map(lobby => {
    const playerCount = lobby.players ? lobby.players.length : 0;
    const maxPlayers = lobby.maxPlayers || 8;
    const isFull = playerCount >= maxPlayers;
    const gameInProgress = lobby.status === 'in-progress';
    
    return `
      <div class="lobby-item ${isFull ? 'lobby-full' : ''} ${gameInProgress ? 'lobby-in-progress' : ''}" 
           data-lobby-id="${lobby.id}">
        <div class="lobby-header">
          <h3 class="lobby-name">${lobby.name}</h3>
          <span class="lobby-status">${lobby.status || 'waiting'}</span>
        </div>
        <div class="lobby-info">
          <span class="lobby-players">${playerCount}/${maxPlayers} players</span>
          <span class="lobby-mode">${lobby.gameMode || 'standard'}</span>
        </div>
        <div class="lobby-actions">
          ${!isFull && !gameInProgress ? 
            `<button class="lobby-join-btn" onclick="joinLobby('${lobby.id}')">Join</button>` : 
            `<button class="lobby-join-btn" disabled>${isFull ? 'Full' : 'In Progress'}</button>`
          }
          ${lobby.spectatorMode && gameInProgress ? 
            `<button class="lobby-spectate-btn" onclick="spectateLobby('${lobby.id}')">Spectate</button>` : ''
          }
        </div>
      </div>
    `;
  }).join('');
  
  setElementHTML(lobbyListEl, lobbiesHTML);
}

/**
 * Initialize lobby system
 * @param {object} dependencies - Required dependencies (socket)
 */
export function initializeLobbySystem(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🏛️ Initializing lobby system...');
  
  // Set up lobby creation form
  const createLobbyBtn = getElement('create-lobby-btn');
  if (createLobbyBtn) {
    createLobbyBtn.addEventListener('click', () => createLobby(dependencies));
  }
  
  // Set up lobby actions
  const readyBtn = getElement('lobby-ready-btn');
  if (readyBtn) {
    readyBtn.addEventListener('click', () => toggleReady(dependencies));
  }
  
  const leaveLobbyBtn = getElement('lobby-leave-btn');
  if (leaveLobbyBtn) {
    leaveLobbyBtn.addEventListener('click', () => leaveLobby(dependencies));
  }
  
  const startGameBtn = getElement('lobby-start-btn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      if (socket) {
        socket.emit('start-lobby-game');
      }
    });
  }
  
  const refreshBtn = getElement('lobby-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => refreshLobbies(dependencies));
  }
  
  // Initial lobby list load
  refreshLobbies(dependencies);
  
  console.log('✅ Lobby system initialized');
}

/**
 * Handle lobby events from socket
 * @param {object} socket - Socket connection
 */
export function setupLobbySocketHandlers(socket) {
  if (!socket) return;
  
  console.log('🔌 Setting up lobby socket handlers...');
  
  // Lobby list updated
  socket.on('lobby-list', (lobbies) => {
    updateLobbyList(lobbies);
  });
  
  // Joined lobby
  socket.on('lobby-joined', (lobby) => {
    console.log('✅ Joined lobby:', lobby);
    hideLobbyUI();
    showLobbyRoom(lobby);
  });
  
  // Lobby updated
  socket.on('lobby-updated', (lobby) => {
    console.log('🔄 Lobby updated:', lobby);
    updateLobbyRoomDisplay(lobby);
  });
  
  // Left lobby
  socket.on('lobby-left', () => {
    console.log('👋 Left lobby');
    const lobbyRoom = getElement('lobby-room');
    if (lobbyRoom) hideElement(lobbyRoom);
    showLobbyUI();
    refreshLobbies({ socket });
  });
  
  // Game started from lobby
  socket.on('lobby-game-started', (gameData) => {
    console.log('🎮 Game started from lobby:', gameData);
    const lobbyRoom = getElement('lobby-room');
    if (lobbyRoom) hideElement(lobbyRoom);
    // Game will be handled by main game logic
  });
  
  console.log('✅ Lobby socket handlers set up');
}

/**
 * Get player name for lobby
 * @returns {string} Player name
 */
export function getPlayerName() {
  const playerNameInput = getElement('player-name-input');
  return playerNameInput?.value.trim() || 'Anonymous';
}

/**
 * Validate lobby creation form
 * @returns {object} Validation result with isValid and errors
 */
export function validateLobbyCreation() {
  const errors = [];
  
  const lobbyNameInput = getElement('lobby-name-input');
  const lobbyName = lobbyNameInput?.value.trim();
  
  if (!lobbyName || lobbyName.length < 3) {
    errors.push('Lobby name must be at least 3 characters long');
  }
  
  if (lobbyName && lobbyName.length > 50) {
    errors.push('Lobby name must be less than 50 characters');
  }
  
  const maxPlayersInput = getElement('lobby-max-players');
  const maxPlayers = parseInt(maxPlayersInput?.value);
  
  if (!maxPlayers || maxPlayers < 2 || maxPlayers > 8) {
    errors.push('Max players must be between 2 and 8');
  }
  
  const timeLimitInput = getElement('lobby-time-limit');
  const timeLimit = parseInt(timeLimitInput?.value);
  
  if (!timeLimit || timeLimit < 10 || timeLimit > 300) {
    errors.push('Time limit must be between 10 and 300 seconds');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}