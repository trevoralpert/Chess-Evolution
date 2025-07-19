// Event Handler Manager for EvoChess
// Handles all DOM event listeners and event management

/**
 * Setup spectator event handlers
 */
function setupSpectatorEventHandlers() {
  const joinSpectatorBtn = document.getElementById('join-spectator-btn');
  const leaveSpectatorBtn = document.getElementById('leave-spectator-btn');
  
  if (joinSpectatorBtn) {
    joinSpectatorBtn.addEventListener('click', () => {
      if (typeof joinSpectator === 'function') {
        joinSpectator();
      }
    });
  }
  
  if (leaveSpectatorBtn) {
    leaveSpectatorBtn.addEventListener('click', () => {
      if (typeof leaveSpectator === 'function') {
        leaveSpectator();
      }
    });
  }
}

/**
 * Setup replay event handlers
 */
function setupReplayEventHandlers() {
  // Replay toggle button
  const replayToggle = document.getElementById('replay-toggle');
  if (replayToggle) {
    replayToggle.addEventListener('click', () => {
      const replayUI = document.getElementById('replay-ui');
      if (replayUI) {
        if (replayUI.style.display === 'none') {
          if (typeof showReplayUI === 'function') {
            showReplayUI();
          }
        } else {
          if (typeof hideReplayUI === 'function') {
            hideReplayUI();
          }
        }
      }
    });
  }
  
  // Refresh replays button
  const refreshReplaysBtn = document.getElementById('refresh-replays-btn');
  if (refreshReplaysBtn) {
    refreshReplaysBtn.addEventListener('click', () => {
      const socket = typeof getSocket === 'function' ? getSocket() : 
                    (typeof window !== 'undefined' ? window.socket : null);
      if (socket) {
        socket.emit('get-replays');
      }
    });
  }
  
  // Stop replay button
  const stopReplayBtn = document.getElementById('stop-replay-btn');
  if (stopReplayBtn) {
    stopReplayBtn.addEventListener('click', () => {
      if (typeof stopReplay === 'function') {
        stopReplay();
      }
    });
  }
  
  // Play/pause button
  const replayPlayPause = document.getElementById('replay-play-pause');
  if (replayPlayPause) {
    replayPlayPause.addEventListener('click', () => {
      if (typeof toggleReplayPlayback === 'function') {
        toggleReplayPlayback();
      }
    });
  }
  
  // Step back button
  const replayStepBack = document.getElementById('replay-step-back');
  if (replayStepBack) {
    replayStepBack.addEventListener('click', () => {
      if (typeof stepReplayBackward === 'function') {
        stepReplayBackward();
      }
    });
  }
  
  // Step forward button
  const replayStepForward = document.getElementById('replay-step-forward');
  if (replayStepForward) {
    replayStepForward.addEventListener('click', () => {
      if (typeof stepReplayForward === 'function') {
        stepReplayForward();
      }
    });
  }
  
  // Speed control
  const replaySpeed = document.getElementById('replay-speed');
  if (replaySpeed) {
    replaySpeed.addEventListener('change', (e) => {
      if (typeof setReplaySpeed === 'function') {
        setReplaySpeed(parseFloat(e.target.value));
      }
    });
  }
  
  // Timeline control
  const replayTimeline = document.getElementById('replay-timeline');
  if (replayTimeline) {
    replayTimeline.addEventListener('input', (e) => {
      if (typeof seekReplayToPosition === 'function') {
        seekReplayToPosition(parseFloat(e.target.value));
      }
    });
  }
}

/**
 * Setup window resize handler
 */
function setupWindowEventHandlers() {
  // Window resize handler
  window.addEventListener('resize', () => {
    if (typeof handleWindowResize === 'function') {
      handleWindowResize();
    }
  });
  
  // Animation loop setup
  if (!window.animationStarted) {
    console.log('🎬 Starting animation loop...');
    if (typeof animate === 'function') {
      animate();
    }
    window.animationStarted = true;
  }
}

/**
 * Setup all DOM event handlers
 */
function setupAllEventHandlers() {
  console.log('🎯 Setting up DOM event handlers...');
  
  setupSpectatorEventHandlers();
  setupReplayEventHandlers();
  setupWindowEventHandlers();
  
  console.log('✅ DOM event handlers set up successfully');
}

/**
 * Initialize event handler system
 */
function initializeEventHandlerSystem() {
  console.log('🎯 Initializing Event Handler System');
  
  // Setup all event handlers
  setupAllEventHandlers();
  
  console.log('✅ Event Handler System initialized');
}

export {
  // Individual Handler Setup
  setupSpectatorEventHandlers,
  setupReplayEventHandlers,
  setupWindowEventHandlers,
  
  // Main Setup Functions
  setupAllEventHandlers,
  initializeEventHandlerSystem
};