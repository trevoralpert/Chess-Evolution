// UI Management system for EvoChess
// Handles all UI updates, display management, and user interface interactions

/**
 * Main UI update function - updates game info, player count, and other UI elements
 */
function updateUI() {
  if (typeof gameState === 'undefined' || !gameState) {
    console.warn('gameState not available for UI update');
    return;
  }

  const playerCount = Object.keys(gameState.players).length;
  const playerCountEl = document.getElementById('player-count');
  if (playerCountEl) {
    playerCountEl.textContent = `Players: ${playerCount}`;
  }
  
  const pieceCount = Object.keys(gameState.pieces).length;
  const gameInfoEl = document.getElementById('game-info');
  
  if (gameInfoEl) {
    // Update game info based on player count
    if (playerCount >= 2) {
      gameInfoEl.textContent = `Game ready! ${pieceCount} pieces on board. Click your pieces to move.`;
      gameInfoEl.style.color = '#00ff00';
    } else if (playerCount === 1) {
      gameInfoEl.textContent = 'Waiting for opponent... Click "Add AI Player" to start!';
      gameInfoEl.style.color = '#ffaa00';
    } else {
      gameInfoEl.textContent = 'Waiting for players to join...';
      gameInfoEl.style.color = '#ffffff';
    }
  }
  
  // Update player name display
  updatePlayerNameDisplay();
  
  // Update selected color display
  updateSelectedColorDisplay();
  
  // Update player color indicators
  if (typeof updatePlayerColorIndicators === 'function') {
    updatePlayerColorIndicators();
  }
}

/**
 * Update the active player name display
 */
function updatePlayerNameDisplay() {
  const activePlayerNameEl = document.getElementById('active-player-name');
  if (activePlayerNameEl && typeof gameState !== 'undefined' && gameState && typeof socket !== 'undefined') {
    const myPlayer = gameState.players[socket.id];
    if (myPlayer) {
      activePlayerNameEl.textContent = myPlayer.name || (typeof getPlayerName === 'function' ? getPlayerName() : 'Unknown Player');
    } else {
      activePlayerNameEl.textContent = (typeof getPlayerName === 'function' ? getPlayerName() : 'Connecting...');
    }
  }
}

/**
 * Update the selected color display
 */
function updateSelectedColorDisplay() {
  const selectedColorEl = document.getElementById('selected-color');
  if (selectedColorEl && typeof gameState !== 'undefined' && gameState && typeof socket !== 'undefined') {
    const myPlayer = gameState.players[socket.id];
    if (myPlayer && myPlayer.selectedColor) {
      selectedColorEl.textContent = `Selected: ${myPlayer.selectedColor}`;
      selectedColorEl.style.color = myPlayer.selectedColor;
    } else {
      // Use MenuManager's updateSelectedColorDisplay if available
      if (typeof updateSelectedColorDisplay === 'function') {
        updateSelectedColorDisplay();
      } else {
        selectedColorEl.textContent = 'None selected';
        selectedColorEl.style.color = '#aaa';
      }
    }
  }
}

/**
 * Update the lobby list display
 * @param {Array} lobbies - Array of lobby objects
 */
function updateLobbyList(lobbies) {
  const lobbyList = document.getElementById('lobby-list');
  if (!lobbyList) return;
  
  if (lobbies.length === 0) {
    lobbyList.innerHTML = '<div style="color: #888; font-size: 12px;">No lobbies available</div>';
    return;
  }
  
  const lobbiesHtml = lobbies.map(lobby => 
    `<div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; margin-bottom: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 3px;">
      <div>
        <div style="font-weight: bold; color: #00aaff;">${lobby.name}</div>
        <div style="font-size: 10px; color: #ccc;">by ${lobby.creator} • ${lobby.playerCount}/${lobby.maxPlayers} players • ${lobby.gameMode}</div>
      </div>
      <button onclick="joinLobby('${lobby.id}')" style="padding: 3px 8px; background: #00aaff; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Join</button>
    </div>`
  ).join('');
  
  lobbyList.innerHTML = lobbiesHtml;
}

/**
 * Update the AI players list display
 */
function updateAIPlayersList() {
  const aiList = document.getElementById('ai-players-list');
  if (!aiList) return;
  
  const currentAIPlayers = typeof getCurrentAIPlayers === 'function' ? getCurrentAIPlayers() : [];
  
  if (currentAIPlayers.length === 0) {
    aiList.innerHTML = '<div style="color: #888; font-size: 12px;">No AI players active</div>';
    return;
  }
  
  aiList.innerHTML = currentAIPlayers.map(aiPlayer => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: bold; color: ${aiPlayer.color};">🤖 ${aiPlayer.name}</div>
        <div style="font-size: 11px; color: #ccc;">${aiPlayer.aiDifficulty} | ${aiPlayer.pieces.length} pieces</div>
      </div>
      <div style="display: flex; gap: 5px;">
        <button onclick="showAIStats('${aiPlayer.id}')" style="padding: 2px 5px; background: #555; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">Stats</button>
        <button onclick="removeAIPlayer('${aiPlayer.id}')" style="padding: 2px 5px; background: #cc0000; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">Remove</button>
      </div>
    </div>
  `).join('');
}

/**
 * Update the spectator games list display
 * @param {Array} games - Array of spectatable game objects
 */
function updateSpectatorGamesList(games) {
  const gamesList = document.getElementById('spectator-games-list');
  if (!gamesList) return;
  
  if (games.length === 0) {
    gamesList.innerHTML = '<div style="color: #888; font-size: 12px;">No games available to spectate</div>';
    return;
  }
  
  gamesList.innerHTML = games.map(game => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; cursor: pointer;" 
         onclick="joinSpectatorGame('${game.gameId}')">
      <div style="font-weight: bold;">Game: ${game.gameId}</div>
      <div style="font-size: 11px; color: #ccc;">Spectators: ${game.spectatorCount}</div>
    </div>
  `).join('');
}

/**
 * Update the replays list display
 * @param {Array} replays - Array of replay objects
 */
function updateReplaysList(replays) {
  const replaysList = document.getElementById('replay-list');
  if (!replaysList) return;
  
  if (replays.length === 0) {
    replaysList.innerHTML = '<div style="color: #888; font-size: 12px;">No replays available</div>';
    return;
  }
  
  replaysList.innerHTML = replays.map(replay => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; cursor: pointer;" 
         onclick="playReplay('${replay.gameId}')">
      <div style="font-weight: bold;">Game: ${replay.gameId}</div>
      <div style="font-size: 11px; color: #ccc;">
        Players: ${replay.players.join(', ')} | Duration: ${formatTime(replay.duration)} | Moves: ${replay.moveCount}
      </div>
      <div style="font-size: 10px; color: #888;">
        Played: ${new Date(replay.metadata.created).toLocaleString()}
      </div>
    </div>
  `).join('');
}

/**
 * Update the replay UI controls and information
 */
function updateReplayUI() {
  const currentReplay = typeof getCurrentReplay === 'function' ? getCurrentReplay() : null;
  const replayCurrentMove = typeof getReplayCurrentMove === 'function' ? getReplayCurrentMove() : 0;
  
  if (!currentReplay) return;
  
  const replayCurrentMoveEl = document.getElementById('replay-current-move');
  const replayTotalMovesEl = document.getElementById('replay-total-moves');
  
  if (replayCurrentMoveEl) replayCurrentMoveEl.textContent = replayCurrentMove;
  if (replayTotalMovesEl) replayTotalMovesEl.textContent = currentReplay.moves.length;
  
  const currentTime = currentReplay.moves[replayCurrentMove - 1]?.timestamp || 0;
  const totalTime = currentReplay.duration || 0;
  
  const replayCurrentTimeEl = document.getElementById('replay-current-time');
  const replayTotalTimeEl = document.getElementById('replay-total-time');
  
  if (replayCurrentTimeEl) replayCurrentTimeEl.textContent = formatTime(currentTime);
  if (replayTotalTimeEl) replayTotalTimeEl.textContent = formatTime(totalTime);
  
  const replayTimelineEl = document.getElementById('replay-timeline');
  if (replayTimelineEl) {
    replayTimelineEl.value = (replayCurrentMove / currentReplay.moves.length) * 100;
  }
  
  const replayGameIdEl = document.getElementById('replay-game-id');
  const replayPlayersEl = document.getElementById('replay-players');
  const replayDurationEl = document.getElementById('replay-duration');
  
  if (replayGameIdEl) replayGameIdEl.textContent = currentReplay.gameId;
  if (replayPlayersEl) replayPlayersEl.textContent = currentReplay.players.join(', ');
  if (replayDurationEl) replayDurationEl.textContent = formatTime(totalTime);
}

/**
 * Update statistics button styles
 * @param {string} activeButtonId - ID of the currently active button
 */
function updateStatsButtonStyles(activeButtonId) {
  const buttons = ['show-personal-stats', 'show-leaderboard', 'show-achievements', 'show-global-stats'];
  buttons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      if (buttonId === activeButtonId) {
        button.style.background = '#cc00cc';
      } else {
        button.style.background = '#6600aa';
      }
    }
  });
}

/**
 * Update spectator UI elements
 * @param {Object} data - Spectator data
 */
function updateSpectatorUI(data) {
  const joinSpectatorBtn = document.getElementById('join-spectator-btn');
  const leaveSpectatorBtn = document.getElementById('leave-spectator-btn');
  const spectatorGameStatus = document.getElementById('spectator-game-status');
  const spectatorCount = document.getElementById('spectator-count');
  
  if (data.joined) {
    if (joinSpectatorBtn) joinSpectatorBtn.style.display = 'none';
    if (leaveSpectatorBtn) leaveSpectatorBtn.style.display = 'block';
    if (spectatorGameStatus) spectatorGameStatus.textContent = 'Spectating';
  } else {
    if (joinSpectatorBtn) joinSpectatorBtn.style.display = 'block';
    if (leaveSpectatorBtn) leaveSpectatorBtn.style.display = 'none';
    if (spectatorGameStatus) spectatorGameStatus.textContent = 'Not spectating';
  }
  
  if (data.count !== undefined && spectatorCount) {
    spectatorCount.textContent = data.count;
  }
}

/**
 * Show/hide UI sections
 * @param {string} sectionId - ID of the section to show
 * @param {boolean} show - Whether to show or hide
 */
function toggleUISection(sectionId, show = true) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = show ? 'block' : 'none';
  }
}

/**
 * Update game visualization for replay mode
 * @param {Object} gameState - Game state data
 * @param {Array} moves - Array of moves
 */
function updateGameVisualization(gameState, moves) {
  // Update the 3D visualization with replay data
  // This would integrate with the existing game state update logic
  console.log('Updating game visualization with replay state:', gameState, moves);
}

/**
 * Format time in milliseconds to MM:SS format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Update player list display
 * @param {Object} players - Players object from game state
 */
function updatePlayerList(players) {
  const playerListEl = document.getElementById('player-list');
  if (!playerListEl || !players) return;
  
  const playerEntries = Object.entries(players).map(([playerId, player]) => {
    const isCurrentPlayer = typeof socket !== 'undefined' && socket.id === playerId;
    return `
      <div style="display: flex; align-items: center; margin-bottom: 3px; ${isCurrentPlayer ? 'font-weight: bold; background: rgba(255, 255, 255, 0.1); padding: 2px 4px; border-radius: 3px;' : ''}">
        <div style="width: 16px; height: 16px; background-color: ${player.color || '#ffffff'}; border-radius: 2px; margin-right: 8px; border: 1px solid #666;"></div>
        <span style="color: #fff;">${player.name}${isCurrentPlayer ? ' (You)' : ''}</span>
      </div>
    `;
  }).join('');
  
  playerListEl.innerHTML = playerEntries;
}

/**
 * Update game board info display
 * @param {Object} gameInfo - Game information object
 */
function updateGameBoardInfo(gameInfo) {
  if (!gameInfo) return;
  
  const elements = {
    'game-status': gameInfo.status,
    'current-turn': gameInfo.currentTurn,
    'turn-time-left': gameInfo.timeLeft ? formatTime(gameInfo.timeLeft) : '',
    'game-mode': gameInfo.mode,
    'round-number': gameInfo.round
  };
  
  Object.entries(elements).forEach(([elementId, value]) => {
    const element = document.getElementById(elementId);
    if (element && value !== undefined) {
      element.textContent = value;
    }
  });
}

/**
 * Update scoreboard display
 * @param {Object} scores - Scores object
 */
function updateScoreboard(scores) {
  const scoreboardEl = document.getElementById('scoreboard');
  if (!scoreboardEl || !scores) return;
  
  const scoreEntries = Object.entries(scores)
    .sort(([,a], [,b]) => b.score - a.score)
    .map(([playerId, playerScore]) => `
      <div style="display: flex; justify-content: space-between; padding: 2px 0;">
        <span style="color: ${playerScore.color || '#fff'};">${playerScore.name}</span>
        <span style="color: #fff;">${playerScore.score}</span>
      </div>
    `).join('');
  
  scoreboardEl.innerHTML = scoreEntries;
}

/**
 * Update error display
 * @param {string} errorMessage - Error message to display
 * @param {boolean} show - Whether to show or hide error
 */
function updateErrorDisplay(errorMessage, show = true) {
  const errorEl = document.getElementById('error-display');
  if (errorEl) {
    if (show && errorMessage) {
      errorEl.textContent = errorMessage;
      errorEl.style.display = 'block';
      errorEl.style.color = '#ff4444';
      errorEl.style.background = 'rgba(255, 68, 68, 0.1)';
      errorEl.style.padding = '10px';
      errorEl.style.borderRadius = '5px';
      errorEl.style.border = '1px solid #ff4444';
    } else {
      errorEl.style.display = 'none';
    }
  }
}

/**
 * Update loading display
 * @param {string} loadingMessage - Loading message to display
 * @param {boolean} show - Whether to show or hide loading
 */
function updateLoadingDisplay(loadingMessage, show = true) {
  const loadingEl = document.getElementById('loading-display');
  if (loadingEl) {
    if (show) {
      loadingEl.textContent = loadingMessage || 'Loading...';
      loadingEl.style.display = 'block';
    } else {
      loadingEl.style.display = 'none';
    }
  }
}

export {
  updateUI,
  updatePlayerNameDisplay,
  updateSelectedColorDisplay,
  updateLobbyList,
  updateAIPlayersList,
  updateSpectatorGamesList,
  updateReplaysList,
  updateReplayUI,
  updateStatsButtonStyles,
  updateSpectatorUI,
  toggleUISection,
  updateGameVisualization,
  formatTime,
  updatePlayerList,
  updateGameBoardInfo,
  updateScoreboard,
  updateErrorDisplay,
  updateLoadingDisplay
};