// UI Manager Module - Handles various UI components and states
export class UIManager {
  constructor() {
    this.isDualMovementVisible = false;
  }

  initialize() {
    console.log('🎨 Initializing UI Manager...');
    
    // Listen for UI-related events
    document.addEventListener('showDualMovementUI', () => {
      this.showDualMovementUI();
    });
    
    document.addEventListener('hideDualMovementUI', () => {
      this.hideDualMovementUI();
    });
    
    document.addEventListener('updateModeButtons', (event) => {
      this.updateModeButtons(event.detail.selectedMode);
    });
    
    console.log('✅ UI Manager initialized');
  }

  showDualMovementUI() {
    console.log('🎯 Showing dual movement UI');
    
    const dualMovementUI = document.getElementById('dual-movement-ui');
    if (dualMovementUI) {
      dualMovementUI.style.display = 'block';
      this.isDualMovementVisible = true;
    } else {
      // Create dual movement UI if it doesn't exist
      this.createDualMovementUI();
    }
  }

  hideDualMovementUI() {
    console.log('🎯 Hiding dual movement UI');
    
    const dualMovementUI = document.getElementById('dual-movement-ui');
    if (dualMovementUI) {
      dualMovementUI.style.display = 'none';
      this.isDualMovementVisible = false;
    }
  }

  createDualMovementUI() {
    // Create dual movement UI for hybrid pieces
    const uiHTML = `
      <div id="dual-movement-ui" style="
        position: fixed;
        top: 50%;
        left: 20px;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #00ff00;
        border-radius: 10px;
        padding: 15px;
        color: white;
        z-index: 1000;
        display: none;
      ">
        <h3 style="margin: 0 0 10px 0; color: #00ff00;">Movement Mode</h3>
        <button id="mode-queen" class="mode-button" style="
          display: block;
          width: 100%;
          margin-bottom: 5px;
          padding: 8px;
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 5px;
          cursor: pointer;
        ">Queen Mode</button>
        <button id="mode-rook" class="mode-button" style="
          display: block;
          width: 100%;
          margin-bottom: 5px;
          padding: 8px;
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 5px;
          cursor: pointer;
        ">Rook Mode</button>
        <button id="mode-bishop" class="mode-button" style="
          display: block;
          width: 100%;
          padding: 8px;
          background: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 5px;
          cursor: pointer;
        ">Bishop Mode</button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', uiHTML);
    
    // Add event listeners
    document.getElementById('mode-queen').addEventListener('click', () => {
      if (window.mouseInteraction) {
        window.mouseInteraction.selectMovementMode('queen');
      }
    });
    
    document.getElementById('mode-rook').addEventListener('click', () => {
      if (window.mouseInteraction) {
        window.mouseInteraction.selectMovementMode('rook');
      }
    });
    
    document.getElementById('mode-bishop').addEventListener('click', () => {
      if (window.mouseInteraction) {
        window.mouseInteraction.selectMovementMode('bishop');
      }
    });
    
    this.isDualMovementVisible = true;
  }

  updateModeButtons(selectedMode) {
    const buttons = document.querySelectorAll('.mode-button');
    buttons.forEach(button => {
      button.style.background = '#333';
      button.style.border = '1px solid #555';
    });
    
    const selectedButton = document.getElementById(`mode-${selectedMode}`);
    if (selectedButton) {
      selectedButton.style.background = '#00ff00';
      selectedButton.style.color = '#000';
      selectedButton.style.border = '1px solid #00ff00';
    }
  }

  // Player color indicators
  updatePlayerColorIndicators() {
    if (!window.gameStateManager?.gameState?.players) return;
    
    const players = window.gameStateManager.gameState.players;
    const playerList = document.getElementById('player-list');
    
    if (playerList) {
      playerList.innerHTML = '';
      
      Object.entries(players).forEach(([playerId, player], index) => {
        const playerDiv = document.createElement('div');
        playerDiv.style.cssText = `
          display: flex;
          align-items: center;
          margin-bottom: 5px;
          padding: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
        `;
        
        const colorIndicator = document.createElement('div');
        colorIndicator.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-right: 10px;
          background: ${this.getPlayerDisplayColor(player, index)};
          border: 2px solid white;
        `;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = player.name || `Player ${index + 1}`;
        nameSpan.style.color = 'white';
        
        playerDiv.appendChild(colorIndicator);
        playerDiv.appendChild(nameSpan);
        playerList.appendChild(playerDiv);
      });
    }
  }

  getPlayerDisplayColor(player, playerIndex) {
    const colors = ['#ff0000', '#0088ff', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'];
    
    if (player.color) {
      const colorMap = {
        red: '#ff0000',
        blue: '#0088ff',
        green: '#00ff00',
        yellow: '#ffff00',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        orange: '#ff8800',
        purple: '#8800ff',
        white: '#ffffff',
        black: '#333333'
      };
      return colorMap[player.color] || colors[playerIndex % colors.length];
    }
    
    return colors[playerIndex % colors.length];
  }

  // Show notifications (moved from main file)
  showNotification(message, color = '#00ff00', duration = 3000) {
    console.log('📢 Notification:', message);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: ${color};
      padding: 12px 20px;
      border-radius: 8px;
      border: 2px solid ${color};
      z-index: 10000;
      font-size: 14px;
      font-weight: bold;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Fade in animation
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    requestAnimationFrame(() => {
      notification.style.transition = 'all 0.3s ease';
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });
    
    // Remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  }

  // Update game status display
  updateGameStatus(status, currentPlayer = null) {
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
      let statusText = '';
      
      switch (status) {
        case 'waiting':
          statusText = 'Waiting for players...';
          break;
        case 'playing':
          statusText = currentPlayer ? `${currentPlayer}'s turn` : 'Game in progress';
          break;
        case 'ended':
          statusText = 'Game ended';
          break;
        default:
          statusText = status;
      }
      
      statusEl.textContent = statusText;
    }
  }

  // Clean up UI elements
  dispose() {
    this.hideDualMovementUI();
    
    // Remove any created UI elements
    const dualMovementUI = document.getElementById('dual-movement-ui');
    if (dualMovementUI) {
      dualMovementUI.remove();
    }
  }
}