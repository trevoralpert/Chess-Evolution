// Spectator & Replay System for EvoChess
// Handles spectator mode and game replay functionality

// Spectator and replay data storage
let currentReplay = null;
let isSpectating = false;
let replayPlaying = false;
let replayCurrentMove = 0;
let replaySpeed = 1.0;
let spectatorGames = [];
let replays = [];

/**
 * Show spectator UI
 */
function showSpectatorUI() {
  const spectatorUI = document.getElementById('spectator-ui');
  const tournamentUI = document.getElementById('tournament-ui');
  const replayUI = document.getElementById('replay-ui');
  
  if (spectatorUI) spectatorUI.style.display = 'block';
  if (tournamentUI) tournamentUI.style.display = 'none';
  if (replayUI) replayUI.style.display = 'none';
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('get-spectatable-games');
  }
}

/**
 * Hide spectator UI
 */
function hideSpectatorUI() {
  const spectatorUI = document.getElementById('spectator-ui');
  if (spectatorUI) {
    spectatorUI.style.display = 'none';
  }
  
  if (isSpectating) {
    leaveSpectator();
  }
}

/**
 * Join spectator mode
 * @param {string} gameId - Game ID to spectate (optional, defaults to 'main')
 */
function joinSpectator(gameId = 'main') {
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('join-spectator', { gameId });
    isSpectating = true;
    
    if (typeof showNotification === 'function') {
      showNotification(`Joined spectator mode for game: ${gameId}`, 'info');
    }
  }
}

/**
 * Leave spectator mode
 * @param {string} gameId - Game ID to stop spectating (optional, defaults to 'main')
 */
function leaveSpectator(gameId = 'main') {
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('leave-spectator', { gameId });
    isSpectating = false;
    
    if (typeof showNotification === 'function') {
      showNotification('Left spectator mode', 'info');
    }
  }
}

/**
 * Show replay UI
 */
function showReplayUI() {
  const replayUI = document.getElementById('replay-ui');
  const tournamentUI = document.getElementById('tournament-ui');
  const spectatorUI = document.getElementById('spectator-ui');
  
  if (replayUI) replayUI.style.display = 'block';
  if (tournamentUI) tournamentUI.style.display = 'none';
  if (spectatorUI) spectatorUI.style.display = 'none';
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('get-replays');
  }
}

/**
 * Hide replay UI
 */
function hideReplayUI() {
  const replayUI = document.getElementById('replay-ui');
  if (replayUI) {
    replayUI.style.display = 'none';
  }
  
  if (currentReplay) {
    stopReplay();
  }
}

/**
 * Play a replay
 * @param {string} gameId - Game ID to replay
 */
function playReplay(gameId) {
  if (!gameId) return;
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('get-replay', { gameId });
    
    if (typeof showNotification === 'function') {
      showNotification(`Loading replay for game: ${gameId}`, 'info');
    }
  }
}

/**
 * Stop current replay
 */
function stopReplay() {
  currentReplay = null;
  replayPlaying = false;
  replayCurrentMove = 0;
  
  const replayControls = document.getElementById('replay-controls');
  const stopReplayBtn = document.getElementById('stop-replay-btn');
  
  if (replayControls) replayControls.style.display = 'none';
  if (stopReplayBtn) stopReplayBtn.style.display = 'none';
  
  updateReplayUI();
  
  if (typeof showNotification === 'function') {
    showNotification('Replay stopped', 'info');
  }
}

/**
 * Toggle replay playback
 */
function toggleReplayPlayback() {
  if (!currentReplay) return;
  
  replayPlaying = !replayPlaying;
  
  const playPauseBtn = document.getElementById('replay-play-pause');
  if (playPauseBtn) {
    playPauseBtn.textContent = replayPlaying ? '⏸️' : '▶️';
  }
  
  if (replayPlaying) {
    playReplayStep();
  }
}

/**
 * Play next replay step
 */
function playReplayStep() {
  if (!replayPlaying || !currentReplay) return;
  
  if (replayCurrentMove < currentReplay.moves.length) {
    replayCurrentMove++;
    
    const socket = typeof getSocket === 'function' ? getSocket() : 
                  (typeof window !== 'undefined' ? window.socket : null);
    
    if (socket) {
      socket.emit('replay-seek', { 
        gameId: currentReplay.gameId, 
        moveIndex: replayCurrentMove - 1 
      });
    }
    
    setTimeout(() => {
      playReplayStep();
    }, 1000 / replaySpeed);
  } else {
    replayPlaying = false;
    const playPauseBtn = document.getElementById('replay-play-pause');
    if (playPauseBtn) {
      playPauseBtn.textContent = '▶️';
    }
  }
}

/**
 * Step replay backward
 */
function stepReplayBackward() {
  if (!currentReplay || replayCurrentMove <= 0) return;
  
  replayCurrentMove--;
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('replay-seek', { 
      gameId: currentReplay.gameId, 
      moveIndex: replayCurrentMove - 1 
    });
  }
}

/**
 * Step replay forward
 */
function stepReplayForward() {
  if (!currentReplay || replayCurrentMove >= currentReplay.moves.length) return;
  
  replayCurrentMove++;
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('replay-seek', { 
      gameId: currentReplay.gameId, 
      moveIndex: replayCurrentMove - 1 
    });
  }
}

/**
 * Seek replay to specific position
 * @param {number} position - Position percentage (0-100)
 */
function seekReplayToPosition(position) {
  if (!currentReplay) return;
  
  const targetMove = Math.floor((position / 100) * currentReplay.moves.length);
  replayCurrentMove = targetMove;
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('replay-seek', { 
      gameId: currentReplay.gameId, 
      moveIndex: targetMove - 1 
    });
  }
}

/**
 * Set replay speed
 * @param {number} speed - Replay speed multiplier
 */
function setReplaySpeed(speed) {
  replaySpeed = parseFloat(speed) || 1.0;
  
  // Clamp speed between 0.1 and 5.0
  replaySpeed = Math.max(0.1, Math.min(5.0, replaySpeed));
}

/**
 * Update replay UI elements
 */
function updateReplayUI() {
  if (!currentReplay) {
    const replayInfo = document.getElementById('replay-info');
    if (replayInfo) {
      replayInfo.innerHTML = '<div style="color: #888;">No replay loaded</div>';
    }
    return;
  }
  
  const replayInfo = document.getElementById('replay-info');
  const replayTimeline = document.getElementById('replay-timeline');
  
  if (replayInfo) {
    const progress = currentReplay.moves.length > 0 ? 
      Math.round((replayCurrentMove / currentReplay.moves.length) * 100) : 0;
    
    replayInfo.innerHTML = `
      <div style="margin-bottom: 5px;">
        <strong>Game:</strong> ${currentReplay.gameId || 'Unknown'}
      </div>
      <div style="margin-bottom: 5px;">
        <strong>Move:</strong> ${replayCurrentMove} / ${currentReplay.moves.length}
      </div>
      <div style="margin-bottom: 5px;">
        <strong>Progress:</strong> ${progress}%
      </div>
      <div style="font-size: 12px; color: #ccc;">
        Speed: ${replaySpeed}x
      </div>
    `;
  }
  
  if (replayTimeline) {
    const progress = currentReplay.moves.length > 0 ? 
      (replayCurrentMove / currentReplay.moves.length) * 100 : 0;
    replayTimeline.value = progress;
  }
  
  // Show/hide controls
  const replayControls = document.getElementById('replay-controls');
  const stopReplayBtn = document.getElementById('stop-replay-btn');
  
  if (replayControls) replayControls.style.display = 'block';
  if (stopReplayBtn) stopReplayBtn.style.display = 'block';
}

/**
 * Update spectator games list
 * @param {Array} games - Array of spectatable games
 */
function updateSpectatorGamesList(games) {
  spectatorGames = games || [];
  
  const gamesList = document.getElementById('spectator-games-list');
  if (!gamesList) return;
  
  if (spectatorGames.length === 0) {
    gamesList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No games available to spectate</div>';
    return;
  }
  
  const gamesHtml = spectatorGames.map(game => `
    <div style="
      background: rgba(255, 255, 255, 0.1);
      margin: 5px 0;
      padding: 10px;
      border-radius: 5px;
      border-left: 3px solid #4CAF50;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <h4 style="margin: 0; color: #4CAF50;">Game ${game.id}</h4>
        <span style="color: #00ff00;">${game.status || 'Active'}</span>
      </div>
      <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">
        Players: ${game.players ? game.players.join(' vs ') : 'Unknown'}
      </div>
      <div style="font-size: 11px; color: #aaa; margin-bottom: 8px;">
        Duration: ${formatGameDuration(game.duration)} | Moves: ${game.moveCount || 0}
      </div>
      <button 
        onclick="joinSpectator('${game.id}')"
        style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 5px 15px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        "
      >
        Spectate
      </button>
    </div>
  `).join('');
  
  gamesList.innerHTML = gamesHtml;
}

/**
 * Update replays list
 * @param {Array} replaysList - Array of available replays
 */
function updateReplaysList(replaysList) {
  replays = replaysList || [];
  
  const replaysListEl = document.getElementById('replays-list');
  if (!replaysListEl) return;
  
  if (replays.length === 0) {
    replaysListEl.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No replays available</div>';
    return;
  }
  
  const replaysHtml = replays.map(replay => `
    <div style="
      background: rgba(255, 255, 255, 0.1);
      margin: 5px 0;
      padding: 10px;
      border-radius: 5px;
      border-left: 3px solid #ff6600;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <h4 style="margin: 0; color: #ff6600;">Game ${replay.gameId}</h4>
        <span style="color: #ccc; font-size: 11px;">${formatDate(replay.date)}</span>
      </div>
      <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">
        Players: ${replay.players ? replay.players.join(' vs ') : 'Unknown'}
      </div>
      <div style="font-size: 11px; color: #aaa; margin-bottom: 8px;">
        Duration: ${formatGameDuration(replay.duration)} | Moves: ${replay.moveCount || 0}
      </div>
      <button 
        onclick="playReplay('${replay.gameId}')"
        style="
          background: #ff6600;
          color: white;
          border: none;
          padding: 5px 15px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        "
      >
        Play Replay
      </button>
    </div>
  `).join('');
  
  replaysListEl.innerHTML = replaysHtml;
}

/**
 * Update spectator UI
 * @param {Object} spectatorData - Spectator data
 */
function updateSpectatorUI(spectatorData) {
  if (!spectatorData) return;
  
  const spectatorInfo = document.getElementById('spectator-info');
  if (spectatorInfo) {
    spectatorInfo.innerHTML = `
      <div style="margin-bottom: 5px;">
        <strong>Spectating:</strong> Game ${spectatorData.gameId || 'Unknown'}
      </div>
      <div style="margin-bottom: 5px;">
        <strong>Players:</strong> ${spectatorData.players ? spectatorData.players.join(' vs ') : 'Unknown'}
      </div>
      <div style="margin-bottom: 5px;">
        <strong>Status:</strong> ${spectatorData.status || 'Active'}
      </div>
      <div style="font-size: 12px; color: #ccc;">
        Spectators: ${spectatorData.spectatorCount || 1}
      </div>
    `;
  }
}

/**
 * Handle replay loaded event
 * @param {Object} replayData - Loaded replay data
 */
function handleReplayLoaded(replayData) {
  console.log('Replay loaded:', replayData);
  currentReplay = replayData;
  replayCurrentMove = 0;
  replayPlaying = false;
  
  updateReplayUI();
  
  if (typeof showNotification === 'function') {
    showNotification(`Replay loaded: ${replayData.gameId}`, 'success');
  }
}

/**
 * Handle spectator joined event
 * @param {Object} spectatorData - Spectator data
 */
function handleSpectatorJoined(spectatorData) {
  console.log('Spectator joined:', spectatorData);
  isSpectating = true;
  updateSpectatorUI(spectatorData);
}

/**
 * Handle spectator left event
 */
function handleSpectatorLeft() {
  console.log('Spectator left');
  isSpectating = false;
  
  const spectatorInfo = document.getElementById('spectator-info');
  if (spectatorInfo) {
    spectatorInfo.innerHTML = '<div style="color: #888;">Not spectating any game</div>';
  }
}

/**
 * Setup spectator and replay socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupSpectatorSocketHandlers(socket) {
  if (!socket) return;
  
  // Spectator events
  socket.on('spectatable-games', (data) => {
    console.log('Spectatable games received:', data);
    updateSpectatorGamesList(data.games);
  });
  
  socket.on('spectator-joined', (data) => {
    console.log('Spectator joined:', data);
    handleSpectatorJoined(data);
  });
  
  socket.on('spectator-left', (data) => {
    console.log('Spectator left:', data);
    handleSpectatorLeft();
  });
  
  socket.on('spectator-update', (data) => {
    console.log('Spectator update:', data);
    updateSpectatorUI(data);
  });
  
  // Replay events
  socket.on('replays', (data) => {
    console.log('Replays received:', data);
    updateReplaysList(data.replays);
  });
  
  socket.on('replay-loaded', (data) => {
    console.log('Replay loaded:', data);
    handleReplayLoaded(data);
  });
  
  socket.on('replay-update', (data) => {
    console.log('Replay update:', data);
    // Update game state for replay
    if (typeof updateGameStateFromReplay === 'function') {
      updateGameStateFromReplay(data);
    }
  });
  
  socket.on('replay-error', (data) => {
    console.error('Replay error:', data);
    if (typeof showNotification === 'function') {
      showNotification(`Replay error: ${data.message}`, 'error');
    }
  });
}

/**
 * Format game duration
 * @param {number} duration - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatGameDuration(duration) {
  if (!duration) return 'Unknown';
  
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return 'Unknown';
  
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Initialize spectator/replay system
 */
function initializeSpectatorReplaySystem() {
  console.log('👀 Initializing Spectator/Replay System');
  
  // Make functions globally accessible for onclick handlers
  if (typeof window !== 'undefined') {
    window.joinSpectator = joinSpectator;
    window.playReplay = playReplay;
  }
  
  console.log('✅ Spectator/Replay System initialized');
}

/**
 * Get current replay
 * @returns {Object|null} Current replay data
 */
function getCurrentReplay() {
  return currentReplay;
}

/**
 * Get spectator status
 * @returns {boolean} Whether currently spectating
 */
function getSpectatorStatus() {
  return isSpectating;
}

/**
 * Get replay statistics
 * @returns {Object} Replay statistics
 */
function getReplayStats() {
  return {
    totalReplays: replays.length,
    currentReplay: currentReplay ? currentReplay.gameId : null,
    isReplaying: !!currentReplay,
    replayProgress: currentReplay ? 
      Math.round((replayCurrentMove / currentReplay.moves.length) * 100) : 0
  };
}

/**
 * Get spectator statistics
 * @returns {Object} Spectator statistics
 */
function getSpectatorStats() {
  return {
    totalGames: spectatorGames.length,
    isSpectating: isSpectating,
    spectatorCount: spectatorGames.reduce((sum, game) => sum + (game.spectatorCount || 0), 0)
  };
}

export {
  // Spectator Functions
  showSpectatorUI,
  hideSpectatorUI,
  joinSpectator,
  leaveSpectator,
  
  // Replay Functions
  showReplayUI,
  hideReplayUI,
  playReplay,
  stopReplay,
  toggleReplayPlayback,
  playReplayStep,
  stepReplayBackward,
  stepReplayForward,
  seekReplayToPosition,
  setReplaySpeed,
  
  // UI Update Functions
  updateReplayUI,
  updateSpectatorGamesList,
  updateReplaysList,
  updateSpectatorUI,
  
  // Event Handlers
  handleReplayLoaded,
  handleSpectatorJoined,
  handleSpectatorLeft,
  
  // Socket Handlers
  setupSpectatorSocketHandlers,
  
  // Data Access
  getCurrentReplay,
  getSpectatorStatus,
  getReplayStats,
  getSpectatorStats,
  
  // System Management
  initializeSpectatorReplaySystem,
  
  // Utility Functions
  formatGameDuration,
  formatDate
};