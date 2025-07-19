// Socket Manager Module for handling all socket communications
export class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
  }

  initialize() {
    console.log('📡 Initializing Socket Manager...');
    
    // Listen for game start events from other modules
    document.addEventListener('gameStart', (event) => {
      this.handleGameStart(event.detail);
    });
  }

  handleGameStart(gameData) {
    const { playerName, gameMode, selectedColor } = gameData;
    
    // Initialize socket connection
    this.socket = window.gameSocket;
    window.globalSocket = this.socket;
    
    // Set up socket event listeners
    this.setupSocketListeners();
    
    // Wait for connection, then send appropriate game mode request
    this.socket.on('connection-established', (data) => {
      console.log('✅ Connected to server:', data);
      this.isConnected = true;
      
      // Hide menu, show game UI and timer
      const menuScreen = document.getElementById('menu-screen');
      const gameUI = document.getElementById('ui');
      const timingUI = document.getElementById('timing-ui');
      
      if (menuScreen) menuScreen.style.display = 'none';
      if (gameUI) gameUI.style.display = 'block';
      if (timingUI) timingUI.style.display = 'block';
      
      // Send the appropriate game creation request based on mode
      switch (gameMode) {
        case 'vs-ai':
          console.log('🤖 Requesting vs AI game...');
          this.socket.emit('create-vs-ai-game', {
            playerName: playerName,
            difficulty: 'MEDIUM'
          });
          break;
          
        case 'create-vs-human':
          console.log('🎯 Requesting create vs human game...');
          this.socket.emit('create-vs-human-game', {
            playerName: playerName
          });
          break;
          
        case 'join-vs-human':
          console.log('🤝 Requesting join human game...');
          this.socket.emit('join-human-game', {
            playerName: playerName
          });
          break;
          
        default:
          console.error('Unknown game mode:', gameMode);
          this.socket.emit('create-vs-ai-game', {
            playerName: playerName,
            difficulty: 'MEDIUM'
          });
      }
    });
  }

  setupSocketListeners() {
    console.log('📡 Setting up socket event listeners...');
    
    // Connection handlers
    this.socket.on('connect', () => {
      this.isConnected = true;
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent = 'Connected';
        statusEl.style.color = '#00ff00';
      }
      console.log('Socket connected successfully');
      console.log('My socket ID:', this.socket.id);
      
      // Emit connected event for other modules
      document.dispatchEvent(new CustomEvent('socketConnected', {
        detail: { socketId: this.socket.id }
      }));
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent = 'Disconnected';
        statusEl.style.color = '#ff0000';
      }
      
      document.dispatchEvent(new CustomEvent('socketDisconnected'));
    });

    this.socket.on('game-full', () => {
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

    this.socket.on('game-state-update', (newGameState) => {
      console.log('🔄 Received game state update:', newGameState);
      
      // Emit game state update event for other modules
      document.dispatchEvent(new CustomEvent('gameStateUpdate', {
        detail: { gameState: newGameState }
      }));
    });

    this.socket.on('valid-moves', (data) => {
      document.dispatchEvent(new CustomEvent('validMovesReceived', {
        detail: data
      }));
    });

    this.socket.on('move-result', (data) => {
      document.dispatchEvent(new CustomEvent('moveResult', {
        detail: data
      }));
    });

    this.socket.on('battle-result', (data) => {
      const { winner, loser, battleType } = data;
      console.log(`Battle result: ${winner} defeated ${loser} (${battleType})`);
      
      document.dispatchEvent(new CustomEvent('battleResult', {
        detail: data
      }));
    });

    this.socket.on('piece-evolution', (data) => {
      const { pieceId, oldType, newType, position } = data;
      console.log(`🔄 Piece evolution: ${oldType} → ${newType} for piece ${pieceId}`);
      
      document.dispatchEvent(new CustomEvent('pieceEvolution', {
        detail: data
      }));
    });

    this.socket.on('evolution-choice-required', (data) => {
      document.dispatchEvent(new CustomEvent('evolutionChoiceRequired', {
        detail: data
      }));
    });

    this.socket.on('game-ended', (data) => {
      console.log('🏁 Game ended:', data);
      
      document.dispatchEvent(new CustomEvent('gameEnded', {
        detail: data
      }));
    });

    this.socket.on('player-joined', (data) => {
      console.log('👤 Player joined:', data);
      
      document.dispatchEvent(new CustomEvent('playerJoined', {
        detail: data
      }));
    });

    this.socket.on('player-left', (data) => {
      console.log('👋 Player left:', data);
      
      document.dispatchEvent(new CustomEvent('playerLeft', {
        detail: data
      }));
    });

    this.socket.on('timer-update', (data) => {
      document.dispatchEvent(new CustomEvent('timerUpdate', {
        detail: data
      }));
    });

    this.socket.on('battle-contest-prompt', (data) => {
      document.dispatchEvent(new CustomEvent('battleContestPrompt', {
        detail: data
      }));
    });

    this.socket.on('dice-battle-result', (data) => {
      document.dispatchEvent(new CustomEvent('diceBattleResult', {
        detail: data
      }));
    });

    this.socket.on('notification', (data) => {
      document.dispatchEvent(new CustomEvent('gameNotification', {
        detail: data
      }));
    });

    // Lobby events
    this.socket.on('lobby-created', (data) => {
      document.dispatchEvent(new CustomEvent('lobbyCreated', {
        detail: data
      }));
    });

    this.socket.on('lobby-joined', (data) => {
      document.dispatchEvent(new CustomEvent('lobbyJoined', {
        detail: data
      }));
    });

    this.socket.on('lobby-left', (data) => {
      document.dispatchEvent(new CustomEvent('lobbyLeft', {
        detail: data
      }));
    });

    this.socket.on('lobby-list-update', (data) => {
      document.dispatchEvent(new CustomEvent('lobbyListUpdate', {
        detail: data
      }));
    });

    // Statistics events
    this.socket.on('personal-stats', (data) => {
      document.dispatchEvent(new CustomEvent('personalStats', {
        detail: data
      }));
    });

    this.socket.on('leaderboard-data', (data) => {
      document.dispatchEvent(new CustomEvent('leaderboardData', {
        detail: data
      }));
    });

    this.socket.on('achievements-data', (data) => {
      document.dispatchEvent(new CustomEvent('achievementsData', {
        detail: data
      }));
    });

    this.socket.on('global-stats', (data) => {
      document.dispatchEvent(new CustomEvent('globalStats', {
        detail: data
      }));
    });

    // Tournament events
    this.socket.on('tournament-created', (data) => {
      document.dispatchEvent(new CustomEvent('tournamentCreated', {
        detail: data
      }));
    });

    this.socket.on('tournament-joined', (data) => {
      document.dispatchEvent(new CustomEvent('tournamentJoined', {
        detail: data
      }));
    });

    this.socket.on('tournament-update', (data) => {
      document.dispatchEvent(new CustomEvent('tournamentUpdate', {
        detail: data
      }));
    });

    // AI events
    this.socket.on('ai-difficulties', (data) => {
      document.dispatchEvent(new CustomEvent('aiDifficulties', {
        detail: data
      }));
    });

    this.socket.on('ai-player-added', (data) => {
      document.dispatchEvent(new CustomEvent('aiPlayerAdded', {
        detail: data
      }));
    });

    // Chat events
    this.socket.on('chat-message', (data) => {
      document.dispatchEvent(new CustomEvent('chatMessage', {
        detail: data
      }));
    });

    this.socket.on('chat-history', (data) => {
      document.dispatchEvent(new CustomEvent('chatHistory', {
        detail: data
      }));
    });

    // Spectator events
    this.socket.on('spectator-joined', (data) => {
      document.dispatchEvent(new CustomEvent('spectatorJoined', {
        detail: data
      }));
    });

    this.socket.on('spectator-left', (data) => {
      document.dispatchEvent(new CustomEvent('spectatorLeft', {
        detail: data
      }));
    });

    // Evolution events
    this.socket.on('evolution-bank-update', (data) => {
      document.dispatchEvent(new CustomEvent('evolutionBankUpdate', {
        detail: data
      }));
    });
  }

  // Utility methods for emitting events
  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('Socket not connected, cannot emit:', eventName);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}