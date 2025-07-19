// Timer management system for EvoChess
// Handles game timers, countdowns, and timer-related UI updates

// Timer state variables
let currentTimer = null;
let timerStartTime = 0;
let timerDuration = 7000; // 7 seconds default
let activePlayerId = null;
let isTimerPaused = false;
let pausedTimeRemaining = 0;
let evolutionTimer = null;

/**
 * Start a timer for a specific player
 * @param {string} playerId - Player ID
 * @param {number} timeLimit - Timer duration in milliseconds
 * @param {number} startTime - Start time timestamp
 */
function startTimer(playerId, timeLimit, startTime) {
  activePlayerId = playerId;
  timerStartTime = startTime;
  timerDuration = timeLimit;
  isTimerPaused = false;
  
  // Update UI
  updateTimerDisplay();
  
  // Start the timer interval
  if (currentTimer) {
    clearInterval(currentTimer);
  }
  
  currentTimer = setInterval(() => {
    if (!isTimerPaused) {
      updateTimerDisplay();
    }
  }, 100); // Update every 100ms for smooth animation
  
  console.log(`Timer started for player ${playerId}: ${timeLimit}ms`);
}

/**
 * Pause the current timer (used during battles/evolution)
 */
function pauseTimer() {
  isTimerPaused = true;
  const elapsed = Date.now() - timerStartTime;
  pausedTimeRemaining = Math.max(0, timerDuration - elapsed);
  
  const timerStatusEl = document.getElementById('timer-status');
  const timerBarEl = document.getElementById('timer-bar');
  
  if (timerStatusEl) timerStatusEl.textContent = 'Timer Paused (Battle/Evolution)';
  if (timerBarEl) timerBarEl.style.background = '#666';
  
  console.log('Timer paused');
}

/**
 * Resume a paused timer
 */
function resumeTimer() {
  if (isTimerPaused) {
    isTimerPaused = false;
    timerStartTime = Date.now();
    timerDuration = pausedTimeRemaining;
    
    const timerStatusEl = document.getElementById('timer-status');
    const timerBarEl = document.getElementById('timer-bar');
    
    if (timerStatusEl) timerStatusEl.textContent = 'Timer Active';
    if (timerBarEl) timerBarEl.style.background = 'linear-gradient(90deg, #00ff00, #ffff00, #ff6600, #ff0000)';
    
    console.log('Timer resumed');
  }
}

/**
 * Update the timer display in the UI
 */
function updateTimerDisplay() {
  const timeRemainingElement = document.getElementById('time-remaining');
  const timerBarElement = document.getElementById('timer-bar');
  const timerStatusElement = document.getElementById('timer-status');
  
  if (!timeRemainingElement || !timerBarElement || !timerStatusElement) {
    return; // Elements not found, skip update
  }
  
  if (isTimerPaused) {
    const remainingSeconds = pausedTimeRemaining / 1000;
    timeRemainingElement.textContent = remainingSeconds.toFixed(1);
    timerBarElement.style.width = `${(pausedTimeRemaining / 7000) * 100}%`;
    return;
  }
  
  const elapsed = Date.now() - timerStartTime;
  const remaining = Math.max(0, timerDuration - elapsed);
  const remainingSeconds = remaining / 1000;
  
  timeRemainingElement.textContent = remainingSeconds.toFixed(1);
  
  // Update progress bar
  const progress = (remaining / timerDuration) * 100;
  timerBarElement.style.width = `${progress}%`;
  
  // Update status
  if (remaining <= 0) {
    timerStatusElement.textContent = 'Time expired!';
    timerStatusElement.style.color = '#ff0000';
    if (currentTimer) {
      clearInterval(currentTimer);
      currentTimer = null;
    }
  } else {
    timerStatusElement.textContent = 'Timer Active';
    timerStatusElement.style.color = '#ccc';
  }
}

/**
 * Update active player display
 * @param {string} playerId - Player ID
 * @param {string} playerName - Player name
 */
function updateActivePlayer(playerId, playerName) {
  activePlayerId = playerId;
  const activePlayerNameEl = document.getElementById('active-player-name');
  if (activePlayerNameEl) {
    activePlayerNameEl.textContent = playerName || 'Unknown';
  }
  
  // Highlight if it's your turn (requires socket to be available)
  const timingUI = document.getElementById('timing-ui');
  if (timingUI && typeof socket !== 'undefined') {
    if (playerId === socket.id) {
      timingUI.style.borderColor = '#00ff00';
      timingUI.style.boxShadow = '0 0 10px #00ff00';
    } else {
      timingUI.style.borderColor = '#ff6600';
      timingUI.style.boxShadow = 'none';
    }
  }
}

/**
 * Update turn queue display
 * @param {Array} turnQueue - Array of player IDs in turn order
 */
function updateTurnQueue(turnQueue) {
  const turnQueueList = document.getElementById('turn-queue-list');
  if (!turnQueueList) return;
  
  if (turnQueue && turnQueue.length > 0) {
    const queueText = turnQueue.map((playerId, index) => {
      let playerName = 'Unknown';
      if (typeof gameState !== 'undefined' && gameState.players && gameState.players[playerId]) {
        playerName = gameState.players[playerId].name;
      }
      return `${index + 1}. ${playerName}${playerId === activePlayerId ? ' (Current)' : ''}`;
    }).join(', ');
    turnQueueList.textContent = queueText;
  } else {
    turnQueueList.textContent = '-';
  }
}

/**
 * Start a real-time timer
 * @param {number} duration - Timer duration in milliseconds
 */
function startRealTimeTimer(duration) {
  timerDuration = duration;
  timerStartTime = Date.now();
  isTimerPaused = false;
  
  // Start the timer interval
  if (currentTimer) {
    clearInterval(currentTimer);
  }
  
  currentTimer = setInterval(() => {
    if (!isTimerPaused) {
      const elapsed = Date.now() - timerStartTime;
      const remaining = Math.max(0, timerDuration - elapsed);
      updateTimerDisplayWithValue(remaining);
      
      if (remaining <= 0) {
        clearInterval(currentTimer);
        currentTimer = null;
      }
    }
  }, 100); // Update every 100ms for smooth animation
  
  console.log(`Real-time timer started: ${duration}ms`);
}

/**
 * Update timer display with a specific time value
 * @param {number} timeRemaining - Time remaining in milliseconds
 */
function updateTimerDisplayWithValue(timeRemaining) {
  const timeRemainingElement = document.getElementById('time-remaining');
  const timerBarElement = document.getElementById('timer-bar');
  const timerStatusElement = document.getElementById('timer-status');
  
  console.log('🕒 updateTimerDisplay called with:', timeRemaining, 'Elements found:', {
    timeRemaining: !!timeRemainingElement,
    timerBar: !!timerBarElement, 
    timerStatus: !!timerStatusElement
  });
  
  if (!timeRemainingElement || !timerBarElement || !timerStatusElement) {
    console.log('⚠️ Timer elements not found in DOM');
    return;
  }
  
  const remainingSeconds = timeRemaining / 1000;
  timeRemainingElement.textContent = remainingSeconds.toFixed(1);
  console.log('🕒 Updated timer display to:', remainingSeconds.toFixed(1));
  
  // Update progress bar
  const progress = (timeRemaining / timerDuration) * 100;
  timerBarElement.style.width = `${progress}%`;
  
  // Update status and colors
  if (timeRemaining <= 0) {
    timerStatusElement.textContent = 'Ready to move';
    timerStatusElement.style.color = '#00ff00';
    timerBarElement.style.background = '#00ff00';
  } else {
    timerStatusElement.textContent = 'Timer counting down...';
    timerStatusElement.style.color = '#ff8800';
    timerBarElement.style.background = 'linear-gradient(90deg, #00ff00, #ffff00, #ff6600, #ff0000)';
  }
}

/**
 * Update timer UI with timer object and queued move status
 * @param {Object} timer - Timer object with timeRemaining property
 * @param {Object} queuedMove - Queued move object (if any)
 */
function updateTimerUI(timer, queuedMove) {
  const timerStatusElement = document.getElementById('timer-status');
  const timeRemainingElement = document.getElementById('time-remaining');
  
  if (!timerStatusElement || !timeRemainingElement) return;
  
  if (timer) {
    const remainingSeconds = timer.timeRemaining / 1000;
    timeRemainingElement.textContent = remainingSeconds.toFixed(1);
    
    if (timer.timeRemaining <= 0) {
      timerStatusElement.textContent = 'Ready to move';
      timerStatusElement.style.color = '#00ff00';
    } else {
      if (queuedMove) {
        timerStatusElement.textContent = 'Move queued - waiting for timer';
        timerStatusElement.style.color = '#ffaa00';
      } else {
        timerStatusElement.textContent = 'Timer counting down...';
        timerStatusElement.style.color = '#ff8800';
      }
    }
  }
}

/**
 * Start evolution choice timer
 * @param {number} timeLeft - Time remaining in seconds
 */
function startEvolutionTimer(timeLeft) {
  // Clear any existing evolution timer
  if (evolutionTimer) {
    clearInterval(evolutionTimer);
    evolutionTimer = null;
  }
  
  evolutionTimer = setInterval(() => {
    timeLeft--;
    const evolutionTimerEl = document.getElementById('evolution-timer');
    if (evolutionTimerEl) {
      evolutionTimerEl.textContent = `Time left: ${timeLeft}s`;
    }
    
    if (timeLeft <= 0) {
      clearInterval(evolutionTimer);
      evolutionTimer = null;
      // Hide evolution choice if callback is available
      if (typeof hideEvolutionChoice === 'function') {
        hideEvolutionChoice();
      }
    }
  }, 1000);
}

/**
 * Clear evolution timer
 */
function clearEvolutionTimer() {
  if (evolutionTimer) {
    clearInterval(evolutionTimer);
    evolutionTimer = null;
  }
}

/**
 * Clear all timers
 */
function clearAllTimers() {
  if (currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
  
  if (evolutionTimer) {
    clearInterval(evolutionTimer);
    evolutionTimer = null;
  }
  
  // Reset timer state
  timerStartTime = 0;
  timerDuration = 7000;
  activePlayerId = null;
  isTimerPaused = false;
  pausedTimeRemaining = 0;
}

/**
 * Setup timer socket handlers
 * @param {Socket} socket - Socket.io instance
 */
function setupTimerSocketHandlers(socket) {
  socket.on('timer-started', (data) => {
    console.log('Timer started:', data);
    startTimer(data.playerId, data.timeLimit, data.startTime);
    
    // Also start real-time timer if duration provided
    if (data.timerDuration) {
      startRealTimeTimer(data.timerDuration);
    }
  });

  socket.on('player-timer-started', (data) => {
    console.log('Player timer started:', data);
    startTimer(data.playerId, data.timeLimit, data.startTime);
    
    // Also start real-time timer if duration provided
    if (data.timerDuration) {
      startRealTimeTimer(data.timerDuration);
    }
  });

  socket.on('player-timer-update', (data) => {
    console.log('Player timer update:', data);
    if (data.timeRemaining !== undefined) {
      updateTimerDisplayWithValue(data.timeRemaining);
    }
    
    if (data.expired) {
      clearAllTimers();
      const timerStatusEl = document.getElementById('timer-status');
      if (timerStatusEl) {
        timerStatusEl.textContent = 'Player timed out';
      }
    }
  });

  socket.on('player-timer-zero', (data) => {
    console.log('Player timer reached zero:', data);
    clearAllTimers();
    const timerStatusEl = document.getElementById('timer-status');
    if (timerStatusEl) {
      timerStatusEl.textContent = 'Time expired!';
      timerStatusEl.style.color = '#ff0000';
    }
  });

  socket.on('timer-paused', (data) => {
    console.log('Timer paused:', data);
    pauseTimer();
  });

  socket.on('timer-resumed', (data) => {
    console.log('Timer resumed:', data);
    resumeTimer();
  });

  socket.on('timer-update', (data) => {
    console.log('Timer update:', data);
    updateTimerUI(data.timer, data.queuedMove);
  });
}

// Getters for state access
function getCurrentTimer() {
  return currentTimer;
}

function getActivePlayerId() {
  return activePlayerId;
}

function getTimerState() {
  return {
    currentTimer,
    timerStartTime,
    timerDuration,
    activePlayerId,
    isTimerPaused,
    pausedTimeRemaining,
    evolutionTimer
  };
}

function isTimerActive() {
  return currentTimer !== null;
}

function isEvolutionTimerActive() {
  return evolutionTimer !== null;
}

export {
  startTimer,
  pauseTimer,
  resumeTimer,
  updateTimerDisplay,
  updateActivePlayer,
  updateTurnQueue,
  startRealTimeTimer,
  updateTimerDisplayWithValue,
  updateTimerUI,
  startEvolutionTimer,
  clearEvolutionTimer,
  clearAllTimers,
  setupTimerSocketHandlers,
  getCurrentTimer,
  getActivePlayerId,
  getTimerState,
  isTimerActive,
  isEvolutionTimerActive
};