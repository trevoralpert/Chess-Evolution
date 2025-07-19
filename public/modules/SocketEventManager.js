// Socket Event Management system for EvoChess
// Handles all socket.io event listeners and server communication

/**
 * Setup all socket event listeners for the game
 * @param {Object} socket - Socket.io instance
 */
function setupSocketListeners(socket) {
  if (!socket) {
    console.error('Socket instance is required for setupSocketListeners');
    return;
  }
  
  console.log('📡 Setting up socket event listeners...');
  
  // Connection handlers
  socket.on('connect', () => {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'Connected';
      statusEl.style.color = '#00ff00';
    }
    console.log('Socket connected successfully');
    console.log('My socket ID:', socket.id);
    
    // Initialize game components
    if (typeof initializeGameComponents === 'function') {
      initializeGameComponents();
    }
    
    // Send player info to server
    const colorToUse = (typeof getSelectedColor === 'function' ? getSelectedColor() : null) || 'magenta';
    const playerName = typeof getPlayerName === 'function' ? getPlayerName() : 'Anonymous';
    
    socket.emit('player-joined', {
      name: playerName,
      color: colorToUse
    });
    
    // Request AI difficulties for the dropdown
    socket.emit('get-ai-difficulties');
    
    // Add AI player if vs AI mode
    const gameMode = typeof getGameMode === 'function' ? getGameMode() : null;
    if (gameMode === 'vsai') {
      setTimeout(() => {
        socket.emit('add-ai-player', {
          difficulty: 'MEDIUM',
          personality: {
            preferredPieces: ['QUEEN', 'ROOK', 'BISHOP'],
            playStyle: 'balanced',
            riskTolerance: 0.5,
            aggressiveness: 0.5
          }
        });
      }, 1000);
    }
  });

  socket.on('disconnect', () => {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'Disconnected';
      statusEl.style.color = '#ff0000';
    }
  });

  socket.on('game-full', () => {
    const statusEl = document.getElementById('status');
    const gameInfoEl = document.getElementById('game-info');
    
    if (statusEl) {
      statusEl.textContent = 'Game Full';
      statusEl.style.color = '#ff8800';
    }
    if (gameInfoEl) {
      gameInfoEl.textContent = 'Game is full. Please try again later.';
    }
  });

  socket.on('game-state-update', async (newGameState) => {
    console.log('🔄 Received game state update:', newGameState);
    console.log('🔄 Players in received state:', Object.keys(newGameState.players || {}));
    console.log('🔄 Pieces in received state:', Object.keys(newGameState.pieces || {}));
    console.log('🔄 Number of pieces received:', Object.keys(newGameState.pieces || {}).length);
    
    // PHASE 1D DEBUG: Force rendering in all game modes, including waiting
    const currentGameMode = typeof getGameMode === 'function' ? getGameMode() : 'unknown';
    console.log('🎮 EMPTY BOARD DEBUG: Current game mode:', currentGameMode);
    console.log('🎮 EMPTY BOARD DEBUG: Pieces to render:', Object.values(newGameState.pieces || {}).map(p => `${p.type}@(${p.row},${p.col})`));
    
    // Process delta updates for performance
    const performanceOptimizer = typeof getPerformanceOptimizer === 'function' ? getPerformanceOptimizer() : null;
    const delta = performanceOptimizer ? performanceOptimizer.processDeltaUpdate(newGameState) : { fullUpdate: true };
    
    if (delta.fullUpdate) {
      // Full update on first load
      console.log('🔄 Processing full update');
      if (typeof setGameState === 'function') {
        setGameState(newGameState);
      } else if (typeof window !== 'undefined') {
        window.gameState = newGameState;
      }
      
      // Evolution points are now included in the game state from the server
      Object.keys(newGameState.players).forEach(playerId => {
        const evolutionPoints = newGameState.players[playerId].evolutionPoints;
        console.log(`🎯 Player ${playerId} has ${evolutionPoints} evolution points from server`);
      });
      
      console.log('🎮 EMPTY BOARD DEBUG: About to call updateVisuals() with pieces:', Object.keys(newGameState.pieces || {}));
      
      if (typeof updateVisuals === 'function') {
        await updateVisuals();
      }
      
      console.log('🎮 EMPTY BOARD DEBUG: updateVisuals() completed');
      
      if (typeof updateUI === 'function') {
        updateUI();
      }
      
      console.log('🔄 Full update completed');
    } else {
      // Delta update - only update changed elements
      console.log('🔄 Processing delta update');
      if (typeof setGameState === 'function') {
        setGameState(newGameState);
      } else if (typeof window !== 'undefined') {
        window.gameState = newGameState;
      }
      
      if (typeof updateVisualsDelta === 'function') {
        await updateVisualsDelta(delta);
      }
      
      // Always call updateUI immediately for player count changes
      if (typeof updateUI === 'function') {
        updateUI();
      }
      
      // Update evolution point labels when game state changes
      if (typeof updateAllEvolutionPointLabels === 'function') {
        updateAllEvolutionPointLabels();
      }
      
      // Throttled UI updates for other elements
      if (performanceOptimizer && typeof performanceOptimizer.createThrottledFunction === 'function') {
        performanceOptimizer.createThrottledFunction('ui-update', () => {
          if (typeof updateUI === 'function') {
            updateUI();
          }
        }, 200);
      }
    }
    
    console.log('Game state updated:', newGameState);
    console.log('Players in game state:', Object.keys(newGameState.players || {}));
    console.log('Pieces in game state:', Object.keys(newGameState.pieces || {}));
    console.log('My socket ID:', socket.id);
    console.log('Players object:', newGameState.players);
  });

  // Essential game handlers
  socket.on('valid-moves', (data) => {
    // Only show moves if this is for the currently selected piece
    const selectedPieceId = typeof getSelectedPieceId === 'function' ? getSelectedPieceId() : null;
    if (data.pieceId === selectedPieceId) {
      if (typeof setValidMoves === 'function') {
        setValidMoves(data.moves);
      }
      console.log('Valid moves received for piece:', data.pieceId, data.moves);
    }
  });

  socket.on('move-result', (data) => {
    console.log('Move result:', data);
    
    if (typeof clearValidMoves === 'function') {
      clearValidMoves();
    }
    
    if (data.success) {
      console.log('Move successful');
    } else {
      console.log('Move failed:', data.error);
      if (typeof showNotification === 'function') {
        showNotification(data.message || 'Move failed', '#ff0000', 3000);
      }
    }
  });

  socket.on('battle-result', (data) => {
    console.log('Battle result:', data);
    // Battle results are handled by the game state update
  });

  socket.on('piece-evolution', (data) => {
    const { pieceId, playerId, oldType, newType } = data;
    console.log(`🔄 Piece evolution: ${oldType} → ${newType} for piece ${pieceId}`);
    
    const gameState = typeof getGameState === 'function' ? getGameState() : (typeof window !== 'undefined' ? window.gameState : null);
    if (gameState && gameState.pieces[pieceId]) {
      console.log(`🔄 Updating visual mesh for piece evolution: ${pieceId} from ${oldType} to ${newType}`);
      
      // Get world position for visual effects
      const piece = gameState.pieces[pieceId];
      const worldPos = typeof getWorldPosition === 'function' ? getWorldPosition(piece.row, piece.col) : null;
      
      if (worldPos && typeof visualEffects !== 'undefined' && visualEffects) {
        // Create evolution effect at the piece position
        visualEffects.createEvolutionEffect(worldPos, oldType, newType);
      }
      
      // Show evolution notification
      const player = gameState.players[playerId];
      const playerName = player ? player.name : 'Unknown Player';
      if (typeof showEvolutionNotification === 'function') {
        showEvolutionNotification(playerName, oldType, newType);
      }
    } else {
      console.warn(`⚠️ Piece ${pieceId} not found in game state for evolution`);
    }
  });

  // Player and game management handlers
  socket.on('player-eliminated', (data) => {
    const { playerId, playerName, reason } = data;
    console.log(`Player eliminated: ${playerName} (${reason})`);
    
    // Show elimination notification
    const isYou = socket.id === playerId;
    if (typeof showEliminationNotification === 'function') {
      showEliminationNotification(playerName, reason, isYou);
    }
    
    // Update UI
    if (typeof updateUI === 'function') {
      updateUI();
    }
  });

  socket.on('ai-player-added', (data) => {
    console.log('AI player added:', data);
    if (typeof showTypedNotification === 'function') {
      showTypedNotification('AI Player Added', `${data.name} has joined the game!`, 'success');
    }
  });

  socket.on('ai-difficulties', (data) => {
    console.log('AI difficulties received:', data);
    
    const difficultySelect = document.getElementById('ai-difficulty-select');
    if (difficultySelect && data.difficulties) {
      difficultySelect.innerHTML = '';
      data.difficulties.forEach(difficulty => {
        const option = document.createElement('option');
        option.value = difficulty.id;
        option.textContent = `${difficulty.name} - ${difficulty.description}`;
        difficultySelect.appendChild(option);
      });
    }
  });

  // Chat handlers
  socket.on('chat-message', (data) => {
    console.log('Chat message received:', data);
    if (typeof displayChatMessage === 'function') {
      displayChatMessage(data);
    }
  });

  socket.on('chat-status', (data) => {
    console.log('Chat status:', data);
    if (typeof updateChatStatus === 'function') {
      updateChatStatus(data);
    }
  });

  // Color selection handlers
  socket.on('color-selected', (data) => {
    console.log('Color selected event:', data);
    if (typeof handleColorSelected === 'function') {
      handleColorSelected(data);
    }
  });

  socket.on('available-colors', (data) => {
    console.log('Available colors:', data);
    if (typeof updateAvailableColors === 'function') {
      updateAvailableColors(data.colors);
    }
  });

  // Timer handlers
  socket.on('player-timer-started', (data) => {
    console.log('Player timer started:', data);
    if (typeof handlePlayerTimerStarted === 'function') {
      handlePlayerTimerStarted(data);
    }
  });

  socket.on('player-timer-update', (data) => {
    console.log('Player timer update:', data);
    if (typeof handlePlayerTimerUpdate === 'function') {
      handlePlayerTimerUpdate(data);
    }
  });

  socket.on('player-timer-zero', (data) => {
    console.log('Player timer reached zero:', data);
    if (typeof handlePlayerTimerZero === 'function') {
      handlePlayerTimerZero(data);
    }
  });

  socket.on('game-started-first-move', (data) => {
    console.log('Game started - first move:', data);
    if (typeof handleGameStartedFirstMove === 'function') {
      handleGameStartedFirstMove(data);
    }
  });

  socket.on('active-player-changed', (data) => {
    console.log('Active player changed:', data);
    if (typeof updateActivePlayer === 'function') {
      updateActivePlayer(data.activePlayer, data.playerName);
    }
    
    // Update active player name in UI
    const activePlayerNameEl = document.getElementById('active-player-name');
    if (activePlayerNameEl) {
      activePlayerNameEl.textContent = data.playerName || 'Unknown';
    }
    
    // Show notification if it's your turn
    if (data.playerId === socket.id) {
      if (typeof showNotification === 'function') {
        showNotification('Your Turn!', 'Make your move', 'info');
      }
    }
  });
}

/**
 * Setup tournament-related socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupTournamentSocketHandlers(socket) {
  if (!socket) return;
  
  socket.on('tournament-joined', (data) => {
    const { tournament, player } = data;
    console.log(`Joined tournament: ${tournament.name} as ${player.name}`);
    
    const gameInfoEl = document.getElementById('game-info');
    if (gameInfoEl) {
      gameInfoEl.textContent = `Joined tournament: ${tournament.name}`;
      gameInfoEl.style.color = '#44ff44';
      setTimeout(() => {
        gameInfoEl.style.color = '#ffffff';
      }, 3000);
    }
    
    if (typeof updateTournamentStatus === 'function') {
      updateTournamentStatus(tournament);
    }
  });

  socket.on('tournament-join-failed', (data) => {
    const { error } = data;
    console.log(`Failed to join tournament: ${error}`);
    
    const gameInfoEl = document.getElementById('game-info');
    if (gameInfoEl) {
      gameInfoEl.textContent = `Failed to join tournament: ${error}`;
      gameInfoEl.style.color = '#ff4444';
      setTimeout(() => {
        gameInfoEl.style.color = '#ffffff';
      }, 3000);
    }
  });

  socket.on('tournament-started', (data) => {
    const { tournament } = data;
    console.log(`Tournament started: ${tournament.name}`);
    
    const gameInfoEl = document.getElementById('game-info');
    if (gameInfoEl) {
      gameInfoEl.textContent = `Tournament started: ${tournament.name}`;
      gameInfoEl.style.color = '#ffd700';
      setTimeout(() => {
        gameInfoEl.style.color = '#ffffff';
      }, 3000);
    }
    
    if (typeof updateTournamentStatus === 'function') {
      updateTournamentStatus(tournament);
    }
  });

  socket.on('tournament-updated', (data) => {
    const { tournament } = data;
    if (typeof updateTournamentStatus === 'function') {
      updateTournamentStatus(tournament);
    }
  });

  socket.on('tournament-match-started', (data) => {
    const { tournamentId, match, tournament } = data;
    console.log(`Tournament match started: ${match.player1.name} vs ${match.player2.name}`);
    
    const gameInfoEl = document.getElementById('game-info');
    if (gameInfoEl) {
      gameInfoEl.textContent = `Match started: ${match.player1.name} vs ${match.player2.name}`;
      gameInfoEl.style.color = '#ffd700';
      setTimeout(() => {
        gameInfoEl.style.color = '#ffffff';
      }, 3000);
    }
    
    if (typeof updateTournamentStatus === 'function') {
      updateTournamentStatus(tournament);
    }
  });

  socket.on('tournament-match-completed', (data) => {
    const { match, tournament } = data;
    console.log(`Tournament match completed: ${match.winner.name} wins!`);
    
    const gameInfoEl = document.getElementById('game-info');
    if (gameInfoEl) {
      gameInfoEl.textContent = `Match completed: ${match.winner.name} wins!`;
      gameInfoEl.style.color = '#44ff44';
      setTimeout(() => {
        gameInfoEl.style.color = '#ffffff';
      }, 3000);
    }
    
    if (typeof updateTournamentStatus === 'function') {
      updateTournamentStatus(tournament);
    }
  });

  socket.on('tournament-completed', (data) => {
    const { tournament, winner, prizes, leaderboard } = data;
    console.log(`Tournament completed: ${winner.name} is the champion!`);
    
    const gameInfoEl = document.getElementById('game-info');
    if (gameInfoEl) {
      gameInfoEl.textContent = `🏆 Tournament Champion: ${winner.name}! 🏆`;
      gameInfoEl.style.color = '#ffd700';
      setTimeout(() => {
        gameInfoEl.style.color = '#ffffff';
      }, 10000);
    }
    
    if (typeof updateTournamentStatus === 'function') {
      updateTournamentStatus(tournament);
    }
  });

  socket.on('tournament-info', (data) => {
    console.log('Tournament info received:', data);
    if (typeof displayTournamentInfo === 'function') {
      displayTournamentInfo(data);
    }
  });
}

/**
 * Setup battle and game action socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupBattleSocketHandlers(socket) {
  if (!socket) return;
  
  socket.on('battle-contest-prompt', (data) => {
    console.log('Battle contest prompt:', data);
    if (typeof showBattleContestPrompt === 'function') {
      showBattleContestPrompt(data.battleId, data.attackingPiece, data.defendingPiece, data.timeLimit);
    }
  });

  socket.on('dice-battle-animation', (data) => {
    console.log('Dice battle animation:', data);
    if (typeof showDiceBattleAnimation === 'function') {
      showDiceBattleAnimation(data);
    }
  });

  socket.on('piece-split', (data) => {
    console.log('Piece split event:', data);
    const { playerId, pieceId, newPieces } = data;
    
    // Show split notification
    const gameState = typeof getGameState === 'function' ? getGameState() : (typeof window !== 'undefined' ? window.gameState : null);
    if (gameState && gameState.players[playerId]) {
      const player = gameState.players[playerId];
      if (typeof showNotification === 'function') {
        showNotification(`Player ${playerId} Splitter Split!`, player.color, 2000);
      }
    }
  });

  socket.on('split-result', (data) => {
    console.log('Split result:', data);
    if (typeof handleSplitResult === 'function') {
      handleSplitResult(data);
    }
  });

  socket.on('jump-capture', (data) => {
    console.log('Jump capture event:', data);
    const { playerId, capturedPieces } = data;
    
    // Show jump capture notification
    const gameState = typeof getGameState === 'function' ? getGameState() : (typeof window !== 'undefined' ? window.gameState : null);
    if (gameState && gameState.players[playerId]) {
      const player = gameState.players[playerId];
      if (typeof showNotification === 'function') {
        showNotification(`Player ${playerId} Jump Capture!`, player.color, 2000);
      }
    }
  });

  socket.on('multi-jump-capture', (data) => {
    console.log('Multi-jump capture event:', data);
    const { playerId, capturedPieces } = data;
    
    // Show multi-jump capture notification
    const gameState = typeof getGameState === 'function' ? getGameState() : (typeof window !== 'undefined' ? window.gameState : null);
    if (gameState && gameState.players[playerId]) {
      const player = gameState.players[playerId];
      if (typeof showNotification === 'function') {
        showNotification(`Player ${playerId} Multi-Capture! ${capturedPieces.length} pieces!`, player.color, 3000);
      }
    }
  });
}

/**
 * Setup spectator and replay socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupSpectatorSocketHandlers(socket) {
  if (!socket) return;
  
  socket.on('spectator-joined', (data) => {
    console.log('Joined as spectator:', data);
    if (typeof updateSpectatorUI === 'function') {
      updateSpectatorUI({ joined: true });
    }
  });

  socket.on('spectator-left', (data) => {
    console.log('Left spectator mode:', data);
    if (typeof updateSpectatorUI === 'function') {
      updateSpectatorUI({ joined: false });
    }
  });

  socket.on('spectator-count-updated', (data) => {
    console.log('Spectator count updated:', data);
    if (typeof updateSpectatorUI === 'function') {
      updateSpectatorUI({ count: data.count });
    }
  });

  socket.on('spectatable-games', (data) => {
    console.log('Spectatable games received:', data);
    if (typeof updateSpectatorGamesList === 'function') {
      updateSpectatorGamesList(data.games);
    }
  });

  socket.on('replay-list', (data) => {
    console.log('Replay list received:', data);
    if (typeof updateReplaysList === 'function') {
      updateReplaysList(data.replays);
    }
  });

  socket.on('replay-data', (data) => {
    console.log('Replay data received:', data);
    if (typeof handleReplayData === 'function') {
      handleReplayData(data);
    }
  });

  socket.on('replay-state', (data) => {
    console.log('Replay state received:', data);
    if (typeof handleReplayState === 'function') {
      handleReplayState(data);
    }
  });
}

/**
 * Setup lobby and matchmaking socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupLobbySocketHandlers(socket) {
  if (!socket) return;
  
  socket.on('lobby-created', (data) => {
    console.log('Lobby created:', data);
    if (typeof showGameEventNotification === 'function') {
      showGameEventNotification('Lobby Created', data.message);
    }
  });

  socket.on('lobby-joined', (data) => {
    console.log('Lobby joined:', data);
    if (typeof showGameEventNotification === 'function') {
      showGameEventNotification('Lobby Joined', data.message);
    }
  });

  socket.on('lobby-left', (data) => {
    console.log('Lobby left:', data);
    if (typeof showGameEventNotification === 'function') {
      showGameEventNotification('Lobby Left', data.message);
    }
  });

  socket.on('lobby-updated', (data) => {
    console.log('Lobby updated:', data);
    if (typeof updateLobbyInfo === 'function') {
      updateLobbyInfo(data);
    }
  });

  socket.on('lobby-list', (data) => {
    console.log('Lobby list received:', data);
    if (typeof updateLobbyList === 'function') {
      updateLobbyList(data.lobbies);
    }
  });

  socket.on('lobby-list-update', (data) => {
    console.log('Lobby list update:', data);
    if (typeof updateLobbyList === 'function') {
      updateLobbyList(data.lobbies);
    }
  });

  socket.on('game-created', (data) => {
    console.log('Game created:', data);
    if (typeof showGameEventNotification === 'function') {
      showGameEventNotification('Game Created!', data.message);
    }
    
    if (typeof startGameCountdown === 'function') {
      startGameCountdown(data.countdown);
    }
  });

  socket.on('game-joined', (data) => {
    console.log('Game joined:', data);
    if (typeof showGameEventNotification === 'function') {
      showGameEventNotification('Game Joined!', data.message);
    }
  });

  socket.on('game-started', (data) => {
    console.log('Game started:', data);
    if (typeof showGameEventNotification === 'function') {
      showGameEventNotification('Game Started!', data.message, 'success');
    }
  });
}

/**
 * Setup comprehensive socket event handlers for all game systems
 * @param {Object} socket - Socket.io instance
 */
function setupAllSocketHandlers(socket) {
  if (!socket) {
    console.error('Socket instance is required for setupAllSocketHandlers');
    return;
  }
  
  // Setup main game handlers
  setupSocketListeners(socket);
  
  // Setup specialized handlers
  setupTournamentSocketHandlers(socket);
  setupBattleSocketHandlers(socket);
  setupSpectatorSocketHandlers(socket);
  setupLobbySocketHandlers(socket);
  
  console.log('📡 All socket event handlers have been set up');
}

export {
  setupSocketListeners,
  setupTournamentSocketHandlers,
  setupBattleSocketHandlers,
  setupSpectatorSocketHandlers,
  setupLobbySocketHandlers,
  setupAllSocketHandlers
};