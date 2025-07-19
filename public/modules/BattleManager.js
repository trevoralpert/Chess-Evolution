// Battle System for EvoChess
// Handles battle contests, dice battles, battle animations, and combat resolution

/**
 * Show battle contest prompt to player
 * @param {string} battleId - Unique battle identifier
 * @param {Object} attackingPiece - Attacking piece data
 * @param {Object} defendingPiece - Defending piece data
 * @param {number} timeLimit - Time limit for decision in seconds
 */
function showBattleContestPrompt(battleId, attackingPiece, defendingPiece, timeLimit) {
  // Remove any existing prompt
  const existingPrompt = document.getElementById('battle-contest-prompt');
  if (existingPrompt) {
    existingPrompt.remove();
  }
  
  // Create contest prompt UI
  const promptDiv = document.createElement('div');
  promptDiv.id = 'battle-contest-prompt';
  promptDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    z-index: 1000;
    border: 2px solid #ff6b6b;
  `;
  
  const countdown = document.createElement('div');
  countdown.id = 'contest-countdown';
  countdown.style.cssText = `
    font-size: 24px;
    font-weight: bold;
    color: #ff6b6b;
    margin-bottom: 10px;
  `;
  
  promptDiv.innerHTML = `
    <h3>Battle Contest!</h3>
    <p>${attackingPiece.symbol || '⚔️'} ${attackingPiece.type} (${attackingPiece.value || 0}pts) attacking your ${defendingPiece.symbol || '🛡️'} ${defendingPiece.type} (${defendingPiece.value || 0}pts)</p>
    <p>Do you want to contest this battle with dice?</p>
    <button id="contest-yes" style="margin: 10px; padding: 10px 20px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Contest!</button>
    <button id="contest-no" style="margin: 10px; padding: 10px 20px; font-size: 16px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Auto-Resolve</button>
  `;
  
  promptDiv.appendChild(countdown);
  document.body.appendChild(promptDiv);
  
  // Get socket reference
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  // Add event listeners
  const contestYes = document.getElementById('contest-yes');
  const contestNo = document.getElementById('contest-no');
  
  if (contestYes) {
    contestYes.addEventListener('click', () => {
      if (socket) {
        socket.emit('contest-response', { battleId, wantsToContest: true });
      }
      promptDiv.remove();
    });
  }
  
  if (contestNo) {
    contestNo.addEventListener('click', () => {
      if (socket) {
        socket.emit('contest-response', { battleId, wantsToContest: false });
      }
      promptDiv.remove();
    });
  }
  
  // Countdown timer
  let timeLeft = timeLimit || 10;
  const updateCountdown = () => {
    if (countdown) {
      countdown.textContent = `Time: ${timeLeft}s`;
    }
    
    if (timeLeft <= 0) {
      // Auto-resolve if no response
      if (socket) {
        socket.emit('contest-response', { battleId, wantsToContest: false });
      }
      if (promptDiv && promptDiv.parentNode) {
        promptDiv.remove();
      }
    } else {
      timeLeft--;
      setTimeout(updateCountdown, 1000);
    }
  };
  updateCountdown();
}

/**
 * Show dice battle animation with results
 * @param {Object} battleLog - Battle log with dice results
 * @param {Object} winner - Winning piece
 * @param {Object} loser - Losing piece
 * @param {number} duration - Animation duration in milliseconds
 */
function showDiceBattleAnimation(battleLog, winner, loser, duration) {
  // Create dice battle animation UI
  const animationDiv = document.createElement('div');
  animationDiv.id = 'dice-battle-animation';
  animationDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    z-index: 1000;
    border: 2px solid #ffd700;
    min-width: 300px;
  `;
  
  animationDiv.innerHTML = `
    <h3>⚔️ DICE BATTLE ⚔️</h3>
    <div id="dice-display" style="font-size: 24px; margin: 20px 0;"></div>
    <div id="battle-status" style="font-size: 18px; color: #ffd700;"></div>
  `;
  
  document.body.appendChild(animationDiv);
  
  const diceDisplay = document.getElementById('dice-display');
  const battleStatus = document.getElementById('battle-status');
  
  // Ensure battleLog has required properties
  const attackerDice = battleLog.attackerDice || [];
  const defenderDice = battleLog.defenderDice || [];
  const rounds = battleLog.rounds || [];
  
  // Show initial dice
  if (diceDisplay) {
    diceDisplay.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin: 20px 0;">
        <div style="text-align: center;">
          <div>Attacker</div>
          <div style="font-size: 32px; color: #ff6b6b;">${attackerDice.join(', ')}</div>
        </div>
        <div style="text-align: center;">
          <div>Defender</div>
          <div style="font-size: 32px; color: #4CAF50;">${defenderDice.join(', ')}</div>
        </div>
      </div>
    `;
  }
  
  if (battleStatus) {
    battleStatus.textContent = 'Rolling dice...';
  }
  
  // Show tie-breaker rounds if any
  let currentRound = 0;
  const showTieBreaker = () => {
    if (currentRound < rounds.length && diceDisplay) {
      const round = rounds[currentRound];
      diceDisplay.innerHTML += `
        <div style="margin: 10px 0; padding: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 5px;">
          <div>Tie-breaker ${currentRound + 1}</div>
          <div style="font-size: 20px;">
            <span style="color: #ff6b6b;">${round.attacker || 0}</span> vs <span style="color: #4CAF50;">${round.defender || 0}</span>
          </div>
        </div>
      `;
      currentRound++;
      setTimeout(showTieBreaker, 1000);
    } else {
      // Show final result
      if (battleStatus) {
        const winnerName = winner ? (winner.type || 'Unknown') : 'Unknown';
        const loserName = loser ? (loser.type || 'Unknown') : 'Unknown';
        battleStatus.innerHTML = `
          <div style="margin: 10px 0;">Battle complete!</div>
          <div style="color: #00ff00;">Winner: ${winnerName}</div>
          <div style="color: #ff6600;">Loser: ${loserName}</div>
        `;
      }
      setTimeout(() => {
        if (animationDiv && animationDiv.parentNode) {
          animationDiv.remove();
        }
      }, 2000);
    }
  };
  
  // Start tie-breaker sequence after initial delay
  setTimeout(showTieBreaker, 1500);
}

/**
 * Handle battle result display
 * @param {Object} result - Battle result data
 */
function handleBattleResult(result) {
  console.log('Battle result:', result);
  
  // Show battle notification
  if (typeof showNotification === 'function') {
    const message = result.winner ? 
      `${result.winner.type} defeats ${result.loser.type}!` :
      'Battle completed!';
    showNotification(message, 'battle');
  }
  
  // Update any battle-related UI elements
  updateBattleUI(result);
}

/**
 * Update battle-related UI elements
 * @param {Object} battleData - Battle data
 */
function updateBattleUI(battleData) {
  // Update battle history if element exists
  const battleHistory = document.getElementById('battle-history');
  if (battleHistory && battleData) {
    const battleEntry = document.createElement('div');
    battleEntry.style.cssText = `
      padding: 5px;
      margin: 2px 0;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      font-size: 12px;
    `;
    
    const timestamp = new Date().toLocaleTimeString();
    const winner = battleData.winner ? battleData.winner.type : 'Unknown';
    const loser = battleData.loser ? battleData.loser.type : 'Unknown';
    
    battleEntry.innerHTML = `
      <div>${timestamp}: ${winner} vs ${loser}</div>
      <div style="color: #00ff00;">Winner: ${winner}</div>
    `;
    
    battleHistory.insertBefore(battleEntry, battleHistory.firstChild);
    
    // Keep only last 10 battles
    while (battleHistory.children.length > 10) {
      battleHistory.removeChild(battleHistory.lastChild);
    }
  }
}

/**
 * Clear all battle-related UI elements
 */
function clearBattleUI() {
  // Remove battle contest prompt
  const contestPrompt = document.getElementById('battle-contest-prompt');
  if (contestPrompt) {
    contestPrompt.remove();
  }
  
  // Remove dice battle animation
  const diceAnimation = document.getElementById('dice-battle-animation');
  if (diceAnimation) {
    diceAnimation.remove();
  }
  
  // Clear battle history
  const battleHistory = document.getElementById('battle-history');
  if (battleHistory) {
    battleHistory.innerHTML = '';
  }
}

/**
 * Setup battle socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupBattleSocketHandlers(socket) {
  if (!socket) return;
  
  socket.on('battle-contest-prompt', (data) => {
    console.log('Battle contest prompt received:', data);
    showBattleContestPrompt(
      data.battleId,
      data.attackingPiece,
      data.defendingPiece,
      data.timeLimit
    );
  });
  
  socket.on('dice-battle-animation', (data) => {
    console.log('Dice battle animation received:', data);
    showDiceBattleAnimation(
      data.battleLog,
      data.winner,
      data.loser,
      data.duration
    );
  });
  
  socket.on('battle-result', (data) => {
    console.log('Battle result received:', data);
    handleBattleResult(data);
  });
  
  socket.on('battle-started', (data) => {
    console.log('Battle started:', data);
    if (typeof showNotification === 'function') {
      showNotification(`Battle started: ${data.attacker?.type} vs ${data.defender?.type}`, 'battle');
    }
  });
  
  socket.on('battle-ended', (data) => {
    console.log('Battle ended:', data);
    if (typeof showNotification === 'function') {
      const winner = data.winner?.type || 'Unknown';
      showNotification(`Battle ended: ${winner} wins!`, 'battle');
    }
    updateBattleUI(data);
  });
}

/**
 * Get battle statistics
 * @returns {Object} Battle statistics
 */
function getBattleStats() {
  const battleHistory = document.getElementById('battle-history');
  const battleCount = battleHistory ? battleHistory.children.length : 0;
  
  return {
    totalBattles: battleCount,
    recentBattles: battleCount
  };
}

/**
 * Initialize battle system
 */
function initializeBattleSystem() {
  console.log('🎯 Initializing Battle System');
  
  // Create battle history container if it doesn't exist
  let battleHistory = document.getElementById('battle-history');
  if (!battleHistory) {
    battleHistory = document.createElement('div');
    battleHistory.id = 'battle-history';
    battleHistory.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 250px;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 100;
      display: none;
    `;
    document.body.appendChild(battleHistory);
  }
  
  console.log('✅ Battle System initialized');
}

/**
 * Toggle battle history display
 */
function toggleBattleHistory() {
  const battleHistory = document.getElementById('battle-history');
  if (battleHistory) {
    battleHistory.style.display = battleHistory.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Create battle contest button for testing
 * @param {string} battleId - Battle ID
 * @param {Object} attackingPiece - Attacking piece
 * @param {Object} defendingPiece - Defending piece
 * @returns {HTMLElement} Button element
 */
function createBattleContestButton(battleId, attackingPiece, defendingPiece) {
  const button = document.createElement('button');
  button.textContent = 'Contest Battle';
  button.style.cssText = `
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    margin: 2px;
  `;
  
  button.addEventListener('click', () => {
    showBattleContestPrompt(battleId, attackingPiece, defendingPiece, 10);
  });
  
  return button;
}

export {
  // Core Battle Functions
  showBattleContestPrompt,
  showDiceBattleAnimation,
  handleBattleResult,
  
  // UI Management
  updateBattleUI,
  clearBattleUI,
  toggleBattleHistory,
  
  // Socket Handlers
  setupBattleSocketHandlers,
  
  // System Management
  initializeBattleSystem,
  getBattleStats,
  
  // Utility Functions
  createBattleContestButton
};