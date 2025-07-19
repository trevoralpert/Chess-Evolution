// Statistics & Leaderboards system for EvoChess
// Handles player statistics, leaderboards, achievements, and performance tracking

// Statistics data storage
let playerStats = null;
let globalStats = null;
let leaderboardData = [];
let achievementsData = [];
let tournaments = [];

/**
 * Show statistics UI
 */
function showStatisticsUI() {
  const statsUI = document.getElementById('stats-ui');
  if (statsUI) {
    statsUI.style.display = 'block';
    showPersonalStats();
  }
}

/**
 * Hide statistics UI
 */
function hideStatisticsUI() {
  const statsUI = document.getElementById('stats-ui');
  if (statsUI) {
    statsUI.style.display = 'none';
  }
}

/**
 * Show personal stats section
 */
function showPersonalStats() {
  // Hide other sections
  const personalStats = document.getElementById('personal-stats');
  const leaderboard = document.getElementById('leaderboard');
  const achievements = document.getElementById('achievements');
  const globalStatsEl = document.getElementById('global-stats');
  
  if (personalStats) personalStats.style.display = 'block';
  if (leaderboard) leaderboard.style.display = 'none';
  if (achievements) achievements.style.display = 'none';
  if (globalStatsEl) globalStatsEl.style.display = 'none';
  
  // Update button styles
  if (typeof updateStatsButtonStyles === 'function') {
    updateStatsButtonStyles('show-personal-stats');
  }
  
  // Request personal stats
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('get-player-stats', {});
  }
}

/**
 * Show leaderboard section
 */
function showLeaderboard() {
  // Hide other sections
  const personalStats = document.getElementById('personal-stats');
  const leaderboard = document.getElementById('leaderboard');
  const achievements = document.getElementById('achievements');
  const globalStatsEl = document.getElementById('global-stats');
  
  if (personalStats) personalStats.style.display = 'none';
  if (leaderboard) leaderboard.style.display = 'block';
  if (achievements) achievements.style.display = 'none';
  if (globalStatsEl) globalStatsEl.style.display = 'none';
  
  // Update button styles
  if (typeof updateStatsButtonStyles === 'function') {
    updateStatsButtonStyles('show-leaderboard');
  }
  
  // Request leaderboard
  refreshLeaderboard();
}

/**
 * Show achievements section
 */
function showAchievements() {
  // Hide other sections
  const personalStats = document.getElementById('personal-stats');
  const leaderboard = document.getElementById('leaderboard');
  const achievements = document.getElementById('achievements');
  const globalStatsEl = document.getElementById('global-stats');
  
  if (personalStats) personalStats.style.display = 'none';
  if (leaderboard) leaderboard.style.display = 'none';
  if (achievements) achievements.style.display = 'block';
  if (globalStatsEl) globalStatsEl.style.display = 'none';
  
  // Update button styles
  if (typeof updateStatsButtonStyles === 'function') {
    updateStatsButtonStyles('show-achievements');
  }
  
  // Request achievements
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('get-achievements', {});
  }
}

/**
 * Show global stats section
 */
function showGlobalStats() {
  // Hide other sections
  const personalStats = document.getElementById('personal-stats');
  const leaderboard = document.getElementById('leaderboard');
  const achievements = document.getElementById('achievements');
  const globalStatsEl = document.getElementById('global-stats');
  
  if (personalStats) personalStats.style.display = 'none';
  if (leaderboard) leaderboard.style.display = 'none';
  if (achievements) achievements.style.display = 'none';
  if (globalStatsEl) globalStatsEl.style.display = 'block';
  
  // Update button styles
  if (typeof updateStatsButtonStyles === 'function') {
    updateStatsButtonStyles('show-global-stats');
  }
  
  // Request global stats
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('get-global-stats');
  }
}

/**
 * Refresh leaderboard data
 */
function refreshLeaderboard() {
  const categorySelect = document.getElementById('leaderboard-category');
  const category = categorySelect ? categorySelect.value : 'rating';
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('get-leaderboard', { category, limit: 50 });
  }
}

/**
 * Display personal statistics
 * @param {Object} stats - Player statistics data
 */
function displayPersonalStats(stats) {
  const contentEl = document.getElementById('personal-stats-content');
  if (!contentEl) return;
  
  if (!stats) {
    contentEl.innerHTML = '<div style="color: #888;">No statistics available. Play some games to see your stats!</div>';
    return;
  }
  
  const html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Game Performance</div>
        <div>Games Played: ${stats.gamesPlayed || 0}</div>
        <div>Games Won: ${stats.gamesWon || 0}</div>
        <div>Win Rate: ${((stats.winRate || 0) * 100).toFixed(1)}%</div>
        <div>Current Rating: ${stats.currentRank || 'Unranked'}</div>
        <div>Best Rating: ${stats.bestRank || 'N/A'}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Battle Stats</div>
        <div>Battles Won: ${stats.battlesWon || 0}</div>
        <div>Battle Win Rate: ${((stats.battleWinRate || 0) * 100).toFixed(1)}%</div>
        <div>Pieces Killed: ${stats.piecesKilled || 0}</div>
        <div>Pieces Lost: ${stats.piecesLost || 0}</div>
        <div>K/D Ratio: ${(stats.killDeathRatio || 0).toFixed(2)}</div>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Evolution & Abilities</div>
        <div>Pieces Evolved: ${stats.piecesEvolved || 0}</div>
        <div>Splitter Uses: ${stats.splitterUses || 0}</div>
        <div>Multi-Captures: ${stats.jumperMultiCaptures || 0}</div>
        <div>Hybrid Mode Changes: ${stats.hybridQueenModeChanges || 0}</div>
        <div>Equator Bonuses: ${stats.equatorBonuses || 0}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Tournaments</div>
        <div>Tournaments Joined: ${stats.tournamentsJoined || 0}</div>
        <div>Tournament Wins: ${stats.tournamentWins || 0}</div>
        <div>Finals Reached: ${stats.tournamentFinals || 0}</div>
        <div>Win Streak: ${stats.currentWinStreak || 0}</div>
        <div>Best Streak: ${stats.bestWinStreak || 0}</div>
      </div>
    </div>
    <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
      <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Recent Games</div>
      ${(stats.recentGames || []).map(game => `
        <div style="display: flex; justify-content: space-between; padding: 2px; border-bottom: 1px solid #333;">
          <span style="color: ${game.result === 'win' ? '#00ff00' : game.result === 'loss' ? '#ff0000' : '#ff6600'};">${(game.result || 'unknown').toUpperCase()}</span>
          <span>${game.gameMode || 'Unknown'}</span>
          <span>${game.moves || 0} moves</span>
          <span>${Math.round((game.duration || 0) / 60)}m ${(game.duration || 0) % 60}s</span>
        </div>
      `).join('')}
    </div>
  `;
  
  contentEl.innerHTML = html;
  
  // Store stats for later use
  playerStats = stats;
}

/**
 * Display leaderboard
 * @param {Array} leaderboard - Leaderboard data
 * @param {string} category - Leaderboard category
 */
function displayLeaderboard(leaderboard, category) {
  const contentEl = document.getElementById('leaderboard-content');
  if (!contentEl) return;
  
  if (!leaderboard || leaderboard.length === 0) {
    contentEl.innerHTML = '<div style="color: #888;">No leaderboard data available.</div>';
    return;
  }
  
  const categoryNames = {
    'rating': 'Rating',
    'wins': 'Wins',
    'winRate': 'Win Rate',
    'battles': 'Battles Won',
    'evolution': 'Evolutions',
    'tournaments': 'Tournaments'
  };
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  const currentPlayerId = socket ? socket.id : null;
  
  const html = `
    <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 2px solid #cc00cc; margin-bottom: 5px; font-weight: bold;">
      <span>Rank</span>
      <span>Player</span>
      <span>${categoryNames[category] || 'Score'}</span>
    </div>
    ${leaderboard.map(entry => `
      <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #333; ${entry.playerId === currentPlayerId ? 'background: rgba(204, 0, 204, 0.2);' : ''}">
        <span style="color: ${entry.rank <= 3 ? '#ffd700' : '#fff'};">#${entry.rank}</span>
        <span style="color: ${entry.playerId === currentPlayerId ? '#cc00cc' : '#fff'};">${entry.playerName}</span>
        <span style="color: ${entry.rank <= 3 ? '#ffd700' : '#fff'};">${formatLeaderboardValue(entry.value, category)}</span>
      </div>
    `).join('')}
  `;
  
  contentEl.innerHTML = html;
  
  // Store leaderboard data
  leaderboardData = leaderboard;
}

/**
 * Format leaderboard value based on category
 * @param {*} value - Value to format
 * @param {string} category - Category type
 * @returns {string} Formatted value
 */
function formatLeaderboardValue(value, category) {
  if (category === 'winRate') {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (category === 'rating') {
    return Math.round(value);
  }
  return value.toLocaleString();
}

/**
 * Display achievements
 * @param {Array} achievements - Achievements data
 */
function displayAchievements(achievements) {
  const contentEl = document.getElementById('achievements-content');
  if (!contentEl) return;
  
  if (!achievements || achievements.length === 0) {
    contentEl.innerHTML = '<div style="color: #888;">No achievements unlocked yet. Keep playing to earn achievements!</div>';
    return;
  }
  
  const rarityColors = {
    'common': '#ffffff',
    'uncommon': '#1eff00',
    'rare': '#0070dd',
    'epic': '#a335ee',
    'legendary': '#ff8000'
  };
  
  const html = achievements.map(achievement => `
    <div style="display: flex; align-items: center; padding: 8px; margin-bottom: 5px; background: rgba(0, 0, 0, 0.2); border-radius: 3px; border-left: 3px solid ${rarityColors[achievement.rarity] || '#ffffff'};">
      <div style="font-size: 20px; margin-right: 10px;">${achievement.icon || '🏆'}</div>
      <div style="flex: 1;">
        <div style="color: ${rarityColors[achievement.rarity] || '#ffffff'}; font-weight: bold;">${achievement.name}</div>
        <div style="color: #ccc; font-size: 10px;">${achievement.description}</div>
        <div style="color: #888; font-size: 10px;">Earned: ${new Date(achievement.earned).toLocaleDateString()}</div>
      </div>
      <div style="color: ${rarityColors[achievement.rarity] || '#ffffff'}; font-size: 10px; text-transform: uppercase;">${achievement.rarity}</div>
    </div>
  `).join('');
  
  contentEl.innerHTML = html;
  
  // Store achievements data
  achievementsData = achievements;
}

/**
 * Display global statistics
 * @param {Object} stats - Global statistics data
 */
function displayGlobalStats(stats) {
  const contentEl = document.getElementById('global-stats-content');
  if (!contentEl) return;
  
  if (!stats) {
    contentEl.innerHTML = '<div style="color: #888;">No global statistics available.</div>';
    return;
  }
  
  const html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Player Statistics</div>
        <div>Total Players: ${(stats.totalPlayers || 0).toLocaleString()}</div>
        <div>Active Players: ${(stats.activePlayers || 0).toLocaleString()}</div>
        <div>Top Rating: ${stats.topPlayer ? stats.topPlayer.currentRank : 'N/A'}</div>
        <div>Average Rating: ${stats.averageRating ? Math.round(stats.averageRating) : 'N/A'}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Game Statistics</div>
        <div>Total Games: ${(stats.totalGames || 0).toLocaleString()}</div>
        <div>Games Today: ${(stats.gamesToday || 0).toLocaleString()}</div>
        <div>Average Game Length: ${stats.averageGameLength ? `${Math.round(stats.averageGameLength / 60)}m` : 'N/A'}</div>
        <div>Total Tournaments: ${(stats.totalTournaments || 0).toLocaleString()}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Battle Statistics</div>
        <div>Total Battles: ${(stats.totalBattles || 0).toLocaleString()}</div>
        <div>Pieces Evolved: ${(stats.totalEvolutions || 0).toLocaleString()}</div>
        <div>Splitter Uses: ${(stats.totalSplits || 0).toLocaleString()}</div>
        <div>Multi-Captures: ${(stats.totalMultiCaptures || 0).toLocaleString()}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Popular Pieces</div>
        ${(stats.popularPieces || []).map(piece => `
          <div style="display: flex; justify-content: space-between;">
            <span>${piece.type}</span>
            <span>${(piece.usage * 100).toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  contentEl.innerHTML = html;
  
  // Store global stats
  globalStats = stats;
}

/**
 * Show tournament UI
 */
function showTournamentUI() {
  const tournamentUI = document.getElementById('tournament-ui');
  if (tournamentUI) {
    tournamentUI.style.display = 'block';
  }
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('get-tournaments');
  }
}

/**
 * Hide tournament UI
 */
function hideTournamentUI() {
  const tournamentUI = document.getElementById('tournament-ui');
  if (tournamentUI) {
    tournamentUI.style.display = 'none';
  }
}

/**
 * Show tournament creation form
 */
function showTournamentCreation() {
  const tournamentLobby = document.getElementById('tournament-lobby');
  const tournamentCreation = document.getElementById('tournament-creation');
  
  if (tournamentLobby) tournamentLobby.style.display = 'none';
  if (tournamentCreation) tournamentCreation.style.display = 'block';
}

/**
 * Hide tournament creation form
 */
function hideTournamentCreation() {
  const tournamentLobby = document.getElementById('tournament-lobby');
  const tournamentCreation = document.getElementById('tournament-creation');
  
  if (tournamentLobby) tournamentLobby.style.display = 'block';
  if (tournamentCreation) tournamentCreation.style.display = 'none';
}

/**
 * Create a new tournament
 */
function createTournament() {
  const nameInput = document.getElementById('tournament-name');
  const maxPlayersInput = document.getElementById('tournament-max-players');
  
  const name = nameInput ? nameInput.value || 'EvoChess Tournament' : 'EvoChess Tournament';
  const maxPlayers = maxPlayersInput ? parseInt(maxPlayersInput.value) : 8;
  
  const settings = {
    name: name,
    maxPlayers: maxPlayers,
    gameMode: 'classic',
    timeLimit: 300
  };
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('create-tournament', { settings });
  }
  
  hideTournamentCreation();
}

/**
 * Show tournament list
 */
function showTournamentList() {
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('get-tournaments');
  }
  updateTournamentList();
}

/**
 * Update tournament list display
 */
function updateTournamentList() {
  const listElement = document.getElementById('tournament-list');
  if (!listElement) return;
  
  if (tournaments.length === 0) {
    listElement.innerHTML = '<div style="color: #888; font-size: 12px;">No tournaments available</div>';
    return;
  }
  
  listElement.innerHTML = tournaments.map(tournament => `
    <div style="padding: 8px; margin-bottom: 5px; background: rgba(0, 0, 0, 0.2); border-radius: 3px; border-left: 3px solid #cc00cc;">
      <div style="font-size: 13px; color: #fff; margin-bottom: 3px;">${tournament.name}</div>
      <div style="font-size: 10px; color: #ccc;">
        Players: ${tournament.players.length}/${tournament.maxPlayers} |
        Status: ${tournament.status.toUpperCase()}
      </div>
      ${tournament.status === 'waiting' ?
        `<button onclick="joinTournament('${tournament.id}')" style="background: #cc00cc; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer; margin-top: 5px;">Join</button>` :
        ''
      }
    </div>
  `).join('');
}

/**
 * Join a tournament
 * @param {string} tournamentId - Tournament ID to join
 */
function joinTournament(tournamentId) {
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (socket) {
    socket.emit('join-tournament', { tournamentId });
  }
}

/**
 * Update tournament status display
 * @param {Object} tournament - Tournament data
 */
function updateTournamentStatus(tournament) {
  const statusEl = document.getElementById('tournament-status');
  if (!statusEl) return;
  
  if (!tournament) {
    statusEl.innerHTML = '<div style="color: #888;">Not in a tournament</div>';
    return;
  }
  
  const html = `
    <div style="padding: 8px; background: rgba(204, 0, 204, 0.1); border-radius: 3px; border: 1px solid #cc00cc;">
      <div style="font-weight: bold; color: #cc00cc;">${tournament.name}</div>
      <div style="font-size: 10px; color: #ccc;">
        Status: ${tournament.status.toUpperCase()} |
        Players: ${tournament.players.length}/${tournament.maxPlayers}
      </div>
      ${tournament.currentMatch ? `
        <div style="font-size: 10px; color: #ffd700; margin-top: 3px;">
          Current Match: ${tournament.currentMatch.player1.name} vs ${tournament.currentMatch.player2.name}
        </div>
      ` : ''}
    </div>
  `;
  
  statusEl.innerHTML = html;
}

/**
 * Setup statistics socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupStatisticsSocketHandlers(socket) {
  if (!socket) return;
  
  socket.on('player-stats', (data) => {
    console.log('Player stats received:', data);
    displayPersonalStats(data);
  });
  
  socket.on('leaderboard', (data) => {
    console.log('Leaderboard received:', data);
    displayLeaderboard(data.leaderboard, data.category);
  });
  
  socket.on('achievements', (data) => {
    console.log('Achievements received:', data);
    displayAchievements(data.achievements);
  });
  
  socket.on('global-stats', (data) => {
    console.log('Global stats received:', data);
    displayGlobalStats(data);
  });
  
  socket.on('tournaments', (data) => {
    console.log('Tournaments received:', data);
    tournaments = data.tournaments || [];
    updateTournamentList();
  });
  
  socket.on('tournament-updated', (data) => {
    console.log('Tournament updated:', data);
    updateTournamentStatus(data.tournament);
  });
}

/**
 * Get current player stats
 * @returns {Object|null} Current player stats
 */
function getPlayerStats() {
  return playerStats;
}

/**
 * Get current global stats
 * @returns {Object|null} Current global stats
 */
function getGlobalStats() {
  return globalStats;
}

/**
 * Get current leaderboard data
 * @returns {Array} Current leaderboard data
 */
function getLeaderboardData() {
  return leaderboardData;
}

/**
 * Get current achievements data
 * @returns {Array} Current achievements data
 */
function getAchievementsData() {
  return achievementsData;
}

/**
 * Get current tournaments data
 * @returns {Array} Current tournaments data
 */
function getTournaments() {
  return tournaments;
}

/**
 * Set tournaments data
 * @param {Array} newTournaments - New tournaments data
 */
function setTournaments(newTournaments) {
  tournaments = newTournaments || [];
  updateTournamentList();
}

export {
  // UI Management
  showStatisticsUI,
  hideStatisticsUI,
  showPersonalStats,
  showLeaderboard,
  showAchievements,
  showGlobalStats,
  refreshLeaderboard,
  
  // Display Functions
  displayPersonalStats,
  displayLeaderboard,
  displayAchievements,
  displayGlobalStats,
  formatLeaderboardValue,
  
  // Tournament Management
  showTournamentUI,
  hideTournamentUI,
  showTournamentCreation,
  hideTournamentCreation,
  createTournament,
  showTournamentList,
  updateTournamentList,
  joinTournament,
  updateTournamentStatus,
  
  // Socket Handlers
  setupStatisticsSocketHandlers,
  
  // Data Access
  getPlayerStats,
  getGlobalStats,
  getLeaderboardData,
  getAchievementsData,
  getTournaments,
  setTournaments
};