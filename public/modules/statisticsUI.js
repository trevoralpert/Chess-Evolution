// Statistics UI Module
// Functions for stats display, leaderboards, achievements, and statistics management

import { getElement, showElement, hideElement, setElementText, setElementHTML } from './uiReferences.js';
import { UI_ELEMENTS } from './gameConfig.js';

/**
 * Show statistics UI
 */
export function showStatisticsUI() {
  console.log('📊 Showing statistics UI...');
  const statisticsUI = getElement('statistics-ui');
  if (statisticsUI) {
    showElement(statisticsUI);
    // Default to personal stats
    showPersonalStats();
  }
}

/**
 * Hide statistics UI
 */
export function hideStatisticsUI() {
  console.log('📊 Hiding statistics UI...');
  const statisticsUI = getElement('statistics-ui');
  if (statisticsUI) {
    hideElement(statisticsUI);
  }
}

/**
 * Show personal statistics tab
 */
export function showPersonalStats() {
  console.log('👤 Showing personal stats...');
  
  // Update button styles
  updateStatsButtonStyles('stats-personal');
  
  // Show personal stats content
  const personalStats = getElement('stats-personal');
  const leaderboard = getElement('stats-leaderboard');
  const achievements = getElement('stats-achievements');
  const globalStats = getElement('stats-global');
  
  if (personalStats) showElement(personalStats);
  if (leaderboard) hideElement(leaderboard);
  if (achievements) hideElement(achievements);
  if (globalStats) hideElement(globalStats);
  
  // Request personal stats from server
  refreshPersonalStats();
}

/**
 * Show leaderboard tab
 */
export function showLeaderboard() {
  console.log('🏆 Showing leaderboard...');
  
  // Update button styles
  updateStatsButtonStyles('stats-leaderboard');
  
  // Show leaderboard content
  const personalStats = getElement('stats-personal');
  const leaderboard = getElement('stats-leaderboard');
  const achievements = getElement('stats-achievements');
  const globalStats = getElement('stats-global');
  
  if (personalStats) hideElement(personalStats);
  if (leaderboard) showElement(leaderboard);
  if (achievements) hideElement(achievements);
  if (globalStats) hideElement(globalStats);
  
  // Request leaderboard from server
  refreshLeaderboard();
}

/**
 * Show achievements tab
 */
export function showAchievements() {
  console.log('🏅 Showing achievements...');
  
  // Update button styles
  updateStatsButtonStyles('stats-achievements');
  
  // Show achievements content
  const personalStats = getElement('stats-personal');
  const leaderboard = getElement('stats-leaderboard');
  const achievements = getElement('stats-achievements');
  const globalStats = getElement('stats-global');
  
  if (personalStats) hideElement(personalStats);
  if (leaderboard) hideElement(leaderboard);
  if (achievements) showElement(achievements);
  if (globalStats) hideElement(globalStats);
  
  // Request achievements from server
  refreshAchievements();
}

/**
 * Show global statistics tab
 */
export function showGlobalStats() {
  console.log('🌍 Showing global stats...');
  
  // Update button styles
  updateStatsButtonStyles('stats-global');
  
  // Show global stats content
  const personalStats = getElement('stats-personal');
  const leaderboard = getElement('stats-leaderboard');
  const achievements = getElement('stats-achievements');
  const globalStats = getElement('stats-global');
  
  if (personalStats) hideElement(personalStats);
  if (leaderboard) hideElement(leaderboard);
  if (achievements) hideElement(achievements);
  if (globalStats) showElement(globalStats);
  
  // Request global stats from server
  refreshGlobalStats();
}

/**
 * Update statistics button styles
 * @param {string} activeButtonId - ID of the active button
 */
export function updateStatsButtonStyles(activeButtonId) {
  const buttons = ['stats-personal', 'stats-leaderboard', 'stats-achievements', 'stats-global'];
  
  buttons.forEach(buttonId => {
    const button = getElement(buttonId + '-btn');
    if (button) {
      if (buttonId === activeButtonId) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  });
}

/**
 * Refresh leaderboard data
 * @param {object} dependencies - Required dependencies (socket)
 */
export function refreshLeaderboard(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔄 Refreshing leaderboard...');
  
  if (socket) {
    socket.emit('get-leaderboard');
  }
}

/**
 * Refresh personal statistics
 * @param {object} dependencies - Required dependencies (socket)
 */
export function refreshPersonalStats(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔄 Refreshing personal stats...');
  
  if (socket) {
    socket.emit('get-personal-stats');
  }
}

/**
 * Refresh achievements data
 * @param {object} dependencies - Required dependencies (socket)
 */
export function refreshAchievements(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔄 Refreshing achievements...');
  
  if (socket) {
    socket.emit('get-achievements');
  }
}

/**
 * Refresh global statistics
 * @param {object} dependencies - Required dependencies (socket)
 */
export function refreshGlobalStats(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔄 Refreshing global stats...');
  
  if (socket) {
    socket.emit('get-global-stats');
  }
}

/**
 * Display personal statistics
 * @param {object} stats - Personal statistics data
 */
export function displayPersonalStats(stats) {
  console.log('📈 Displaying personal stats:', stats);
  
  const personalStatsContainer = getElement('personal-stats-content');
  if (!personalStatsContainer) {
    console.warn('⚠️ Personal stats container not found');
    return;
  }
  
  if (!stats) {
    setElementHTML(personalStatsContainer, '<p class="no-stats">No statistics available yet. Play some games!</p>');
    return;
  }
  
  const statsHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Games Played</h3>
        <div class="stat-value">${stats.gamesPlayed || 0}</div>
      </div>
      <div class="stat-card">
        <h3>Games Won</h3>
        <div class="stat-value">${stats.gamesWon || 0}</div>
      </div>
      <div class="stat-card">
        <h3>Win Rate</h3>
        <div class="stat-value">${calculateWinRate(stats)}%</div>
      </div>
      <div class="stat-card">
        <h3>Total Pieces Captured</h3>
        <div class="stat-value">${stats.piecesCaptured || 0}</div>
      </div>
      <div class="stat-card">
        <h3>Evolution Points Earned</h3>
        <div class="stat-value">${stats.evolutionPointsEarned || 0}</div>
      </div>
      <div class="stat-card">
        <h3>Pieces Evolved</h3>
        <div class="stat-value">${stats.piecesEvolved || 0}</div>
      </div>
      <div class="stat-card">
        <h3>Average Game Duration</h3>
        <div class="stat-value">${formatDuration(stats.averageGameDuration)}</div>
      </div>
      <div class="stat-card">
        <h3>Longest Game</h3>
        <div class="stat-value">${formatDuration(stats.longestGame)}</div>
      </div>
      <div class="stat-card">
        <h3>Favorite Piece</h3>
        <div class="stat-value">${stats.favoritePiece || 'N/A'}</div>
      </div>
      <div class="stat-card">
        <h3>Current Streak</h3>
        <div class="stat-value">${stats.currentStreak || 0} ${stats.currentStreak === 1 ? 'game' : 'games'}</div>
      </div>
      <div class="stat-card">
        <h3>Best Streak</h3>
        <div class="stat-value">${stats.bestStreak || 0} ${stats.bestStreak === 1 ? 'game' : 'games'}</div>
      </div>
      <div class="stat-card">
        <h3>Rank</h3>
        <div class="stat-value">${stats.rank || 'Unranked'}</div>
      </div>
    </div>
  `;
  
  setElementHTML(personalStatsContainer, statsHTML);
}

/**
 * Display leaderboard
 * @param {Array} leaderboard - Leaderboard data
 * @param {string} category - Leaderboard category
 */
export function displayLeaderboard(leaderboard, category = 'wins') {
  console.log('🏆 Displaying leaderboard:', { leaderboard, category });
  
  const leaderboardContainer = getElement('leaderboard-content');
  if (!leaderboardContainer) {
    console.warn('⚠️ Leaderboard container not found');
    return;
  }
  
  if (!leaderboard || leaderboard.length === 0) {
    setElementHTML(leaderboardContainer, '<p class="no-leaderboard">No leaderboard data available yet.</p>');
    return;
  }
  
  const leaderboardHTML = `
    <div class="leaderboard-header">
      <h3>Top Players - ${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
      <div class="leaderboard-filters">
        <button class="filter-btn ${category === 'wins' ? 'active' : ''}" data-category="wins">Wins</button>
        <button class="filter-btn ${category === 'winRate' ? 'active' : ''}" data-category="winRate">Win Rate</button>
        <button class="filter-btn ${category === 'evolutionPoints' ? 'active' : ''}" data-category="evolutionPoints">Evolution Points</button>
        <button class="filter-btn ${category === 'gamesPlayed' ? 'active' : ''}" data-category="gamesPlayed">Games Played</button>
      </div>
    </div>
    <div class="leaderboard-list">
      ${leaderboard.map((player, index) => `
        <div class="leaderboard-entry ${index < 3 ? 'top-three' : ''}">
          <div class="rank">${getRankDisplay(index + 1)}</div>
          <div class="player-info">
            <div class="player-name">${player.name || 'Anonymous'}</div>
            <div class="player-stats">
              ${category === 'wins' ? `${player.wins || 0} wins` : ''}
              ${category === 'winRate' ? `${calculateWinRate(player)}% win rate` : ''}
              ${category === 'evolutionPoints' ? `${player.evolutionPoints || 0} points` : ''}
              ${category === 'gamesPlayed' ? `${player.gamesPlayed || 0} games` : ''}
            </div>
          </div>
          <div class="player-value">${getLeaderboardValue(player, category)}</div>
        </div>
      `).join('')}
    </div>
  `;
  
  setElementHTML(leaderboardContainer, leaderboardHTML);
  
  // Add filter button event listeners
  const filterBtns = leaderboardContainer.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const newCategory = btn.dataset.category;
      refreshLeaderboard({ category: newCategory });
    });
  });
}

/**
 * Display achievements
 * @param {Array} achievements - Achievements data
 */
export function displayAchievements(achievements) {
  console.log('🏅 Displaying achievements:', achievements);
  
  const achievementsContainer = getElement('achievements-content');
  if (!achievementsContainer) {
    console.warn('⚠️ Achievements container not found');
    return;
  }
  
  if (!achievements || achievements.length === 0) {
    setElementHTML(achievementsContainer, '<p class="no-achievements">No achievements unlocked yet. Keep playing!</p>');
    return;
  }
  
  const achievementsHTML = `
    <div class="achievements-grid">
      ${achievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${achievement.icon || '🏆'}</div>
          <div class="achievement-info">
            <h4 class="achievement-title">${achievement.title}</h4>
            <p class="achievement-description">${achievement.description}</p>
            ${achievement.unlocked ? 
              `<div class="achievement-date">Unlocked: ${formatDate(achievement.unlockedAt)}</div>` :
              `<div class="achievement-progress">${achievement.progress || 0}/${achievement.target || 1}</div>`
            }
          </div>
          ${achievement.unlocked ? '<div class="achievement-badge">✓</div>' : ''}
        </div>
      `).join('')}
    </div>
  `;
  
  setElementHTML(achievementsContainer, achievementsHTML);
}

/**
 * Display global statistics
 * @param {object} stats - Global statistics data
 */
export function displayGlobalStats(stats) {
  console.log('🌍 Displaying global stats:', stats);
  
  const globalStatsContainer = getElement('global-stats-content');
  if (!globalStatsContainer) {
    console.warn('⚠️ Global stats container not found');
    return;
  }
  
  if (!stats) {
    setElementHTML(globalStatsContainer, '<p class="no-stats">Global statistics not available.</p>');
    return;
  }
  
  const globalStatsHTML = `
    <div class="global-stats-grid">
      <div class="global-stat-card">
        <h3>Total Players</h3>
        <div class="stat-value">${stats.totalPlayers || 0}</div>
      </div>
      <div class="global-stat-card">
        <h3>Total Games Played</h3>
        <div class="stat-value">${stats.totalGames || 0}</div>
      </div>
      <div class="global-stat-card">
        <h3>Active Players Today</h3>
        <div class="stat-value">${stats.activeToday || 0}</div>
      </div>
      <div class="global-stat-card">
        <h3>Games in Progress</h3>
        <div class="stat-value">${stats.gamesInProgress || 0}</div>
      </div>
      <div class="global-stat-card">
        <h3>Total Pieces Captured</h3>
        <div class="stat-value">${stats.totalPiecesCaptured || 0}</div>
      </div>
      <div class="global-stat-card">
        <h3>Evolution Points Earned</h3>
        <div class="stat-value">${stats.totalEvolutionPoints || 0}</div>
      </div>
      <div class="global-stat-card">
        <h3>Most Popular Piece</h3>
        <div class="stat-value">${stats.mostPopularPiece || 'N/A'}</div>
      </div>
      <div class="global-stat-card">
        <h3>Average Game Duration</h3>
        <div class="stat-value">${formatDuration(stats.averageGameDuration)}</div>
      </div>
    </div>
  `;
  
  setElementHTML(globalStatsContainer, globalStatsHTML);
}

/**
 * Calculate win rate percentage
 * @param {object} stats - Player statistics
 * @returns {string} Win rate percentage
 */
export function calculateWinRate(stats) {
  if (!stats || !stats.gamesPlayed || stats.gamesPlayed === 0) return '0';
  
  const winRate = (stats.gamesWon / stats.gamesPlayed) * 100;
  return Math.round(winRate * 10) / 10; // Round to 1 decimal place
}

/**
 * Format duration in milliseconds to readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(duration) {
  if (!duration || duration < 0) return '0:00';
  
  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return 'Unknown';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString();
}

/**
 * Get rank display with medal emojis
 * @param {number} rank - Rank number
 * @returns {string} Formatted rank display
 */
export function getRankDisplay(rank) {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}

/**
 * Get leaderboard value for display
 * @param {object} player - Player data
 * @param {string} category - Category to display
 * @returns {string} Formatted value
 */
export function getLeaderboardValue(player, category) {
  switch (category) {
    case 'wins': return player.wins || 0;
    case 'winRate': return `${calculateWinRate(player)}%`;
    case 'evolutionPoints': return player.evolutionPoints || 0;
    case 'gamesPlayed': return player.gamesPlayed || 0;
    default: return 'N/A';
  }
}

/**
 * Initialize statistics UI system
 * @param {object} dependencies - Required dependencies (socket)
 */
export function initializeStatisticsUI(dependencies = {}) {
  console.log('📊 Initializing statistics UI...');
  
  // Set up tab buttons
  const personalBtn = getElement('stats-personal-btn');
  if (personalBtn) {
    personalBtn.addEventListener('click', () => showPersonalStats());
  }
  
  const leaderboardBtn = getElement('stats-leaderboard-btn');
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => showLeaderboard());
  }
  
  const achievementsBtn = getElement('stats-achievements-btn');
  if (achievementsBtn) {
    achievementsBtn.addEventListener('click', () => showAchievements());
  }
  
  const globalBtn = getElement('stats-global-btn');
  if (globalBtn) {
    globalBtn.addEventListener('click', () => showGlobalStats());
  }
  
  // Set up refresh buttons
  const refreshPersonalBtn = getElement('refresh-personal-stats-btn');
  if (refreshPersonalBtn) {
    refreshPersonalBtn.addEventListener('click', () => refreshPersonalStats(dependencies));
  }
  
  const refreshLeaderboardBtn = getElement('refresh-leaderboard-btn');
  if (refreshLeaderboardBtn) {
    refreshLeaderboardBtn.addEventListener('click', () => refreshLeaderboard(dependencies));
  }
  
  console.log('✅ Statistics UI initialized');
}

/**
 * Handle statistics socket events
 * @param {object} socket - Socket connection
 */
export function setupStatisticsSocketHandlers(socket) {
  if (!socket) return;
  
  console.log('🔌 Setting up statistics socket handlers...');
  
  // Personal stats received
  socket.on('personal-stats', (stats) => {
    displayPersonalStats(stats);
  });
  
  // Leaderboard received
  socket.on('leaderboard', (data) => {
    displayLeaderboard(data.leaderboard, data.category);
  });
  
  // Achievements received
  socket.on('achievements', (achievements) => {
    displayAchievements(achievements);
  });
  
  // Global stats received
  socket.on('global-stats', (stats) => {
    displayGlobalStats(stats);
  });
  
  console.log('✅ Statistics socket handlers set up');
}