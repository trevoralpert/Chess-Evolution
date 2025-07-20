// Tournament UI Module
// Functions for tournament creation, management, brackets display, and tournament operations

import { getElement, showElement, hideElement, setElementText, setElementHTML } from './uiReferences.js';
import { UI_ELEMENTS } from './gameConfig.js';
import { formatDate, formatDuration } from './statisticsUI.js';

/**
 * Show tournament UI
 */
export function showTournamentUI() {
  console.log('🏆 Showing tournament UI...');
  const tournamentUI = getElement('tournament-ui');
  if (tournamentUI) {
    showElement(tournamentUI);
    // Default to tournament list
    showTournamentList();
  }
}

/**
 * Hide tournament UI
 */
export function hideTournamentUI() {
  console.log('🏆 Hiding tournament UI...');
  const tournamentUI = getElement('tournament-ui');
  if (tournamentUI) {
    hideElement(tournamentUI);
  }
}

/**
 * Show tournament creation interface
 */
export function showTournamentCreation() {
  console.log('🏗️ Showing tournament creation...');
  const tournamentCreation = getElement('tournament-creation');
  const tournamentList = getElement('tournament-list');
  
  if (tournamentCreation) showElement(tournamentCreation);
  if (tournamentList) hideElement(tournamentList);
}

/**
 * Hide tournament creation interface
 */
export function hideTournamentCreation() {
  console.log('🏗️ Hiding tournament creation...');
  const tournamentCreation = getElement('tournament-creation');
  const tournamentList = getElement('tournament-list');
  
  if (tournamentCreation) hideElement(tournamentCreation);
  if (tournamentList) showElement(tournamentList);
}

/**
 * Create a new tournament
 * @param {object} dependencies - Required dependencies (socket)
 */
export function createTournament(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🏗️ Creating new tournament...');
  
  const tournamentNameInput = getElement('tournament-name-input');
  const maxPlayersInput = getElement('tournament-max-players');
  const formatSelect = getElement('tournament-format');
  const entryFeeInput = getElement('tournament-entry-fee');
  const prizesInput = getElement('tournament-prizes');
  const startTimeInput = getElement('tournament-start-time');
  const descriptionInput = getElement('tournament-description');
  
  const tournamentData = {
    name: tournamentNameInput?.value.trim() || 'New Tournament',
    maxPlayers: parseInt(maxPlayersInput?.value) || 8,
    format: formatSelect?.value || 'single-elimination',
    entryFee: parseInt(entryFeeInput?.value) || 0,
    prizes: prizesInput?.value.trim() || '',
    startTime: startTimeInput?.value || null,
    description: descriptionInput?.value.trim() || '',
    rules: {
      timeLimit: 30,
      evolutionEnabled: true,
      spectatorMode: true
    }
  };
  
  console.log('🏗️ Tournament data:', tournamentData);
  
  if (socket) {
    socket.emit('create-tournament', tournamentData);
  }
  
  // Hide creation form
  hideTournamentCreation();
}

/**
 * Show tournament list
 */
export function showTournamentList() {
  console.log('📋 Showing tournament list...');
  const tournamentList = getElement('tournament-list');
  if (tournamentList) {
    showElement(tournamentList);
    updateTournamentList();
  }
}

/**
 * Update tournament list display
 * @param {Array} tournaments - Array of tournament objects
 */
export function updateTournamentList(tournaments = []) {
  console.log('📋 Updating tournament list:', tournaments);
  
  const tournamentListContainer = getElement('tournament-list-container');
  if (!tournamentListContainer) {
    console.warn('⚠️ Tournament list container not found');
    return;
  }
  
  if (!tournaments || tournaments.length === 0) {
    setElementHTML(tournamentListContainer, '<p class="no-tournaments">No tournaments available. Create one!</p>');
    return;
  }
  
  const tournamentsHTML = tournaments.map(tournament => {
    const playerCount = tournament.players ? tournament.players.length : 0;
    const maxPlayers = tournament.maxPlayers || 8;
    const isFull = playerCount >= maxPlayers;
    const isStarted = tournament.status === 'in-progress';
    const isFinished = tournament.status === 'completed';
    
    return `
      <div class="tournament-item ${isFull ? 'tournament-full' : ''} ${isStarted ? 'tournament-started' : ''} ${isFinished ? 'tournament-finished' : ''}" 
           data-tournament-id="${tournament.id}">
        <div class="tournament-header">
          <h3 class="tournament-name">${tournament.name}</h3>
          <span class="tournament-status status-${tournament.status}">${formatTournamentStatus(tournament.status)}</span>
        </div>
        <div class="tournament-info">
          <div class="tournament-details">
            <span class="tournament-players">👥 ${playerCount}/${maxPlayers} players</span>
            <span class="tournament-format">🏆 ${formatTournamentFormat(tournament.format)}</span>
            ${tournament.entryFee ? `<span class="tournament-fee">💰 ${tournament.entryFee} entry</span>` : ''}
            ${tournament.startTime ? `<span class="tournament-time">⏰ ${formatDate(tournament.startTime)}</span>` : ''}
          </div>
          ${tournament.description ? `<p class="tournament-description">${tournament.description}</p>` : ''}
        </div>
        <div class="tournament-actions">
          ${!isStarted && !isFinished && !isFull ? 
            `<button class="tournament-join-btn" onclick="joinTournament('${tournament.id}')">Join Tournament</button>` : ''
          }
          ${isStarted ? 
            `<button class="tournament-view-btn" onclick="viewTournament('${tournament.id}')">View Brackets</button>` : ''
          }
          ${isFinished ? 
            `<button class="tournament-results-btn" onclick="viewTournamentResults('${tournament.id}')">View Results</button>` : ''
          }
          ${tournament.spectatorMode ? 
            `<button class="tournament-spectate-btn" onclick="spectateTournament('${tournament.id}')">Spectate</button>` : ''
          }
        </div>
        ${tournament.prizes ? `<div class="tournament-prizes">🎁 Prizes: ${tournament.prizes}</div>` : ''}
      </div>
    `;
  }).join('');
  
  setElementHTML(tournamentListContainer, tournamentsHTML);
}

/**
 * Format tournament status for display
 * @param {string} status - Tournament status
 * @returns {string} Formatted status
 */
export function formatTournamentStatus(status) {
  const statusMap = {
    'waiting': 'Waiting for Players',
    'starting': 'Starting Soon',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status;
}

/**
 * Format tournament format for display
 * @param {string} format - Tournament format
 * @returns {string} Formatted format
 */
export function formatTournamentFormat(format) {
  const formatMap = {
    'single-elimination': 'Single Elimination',
    'double-elimination': 'Double Elimination',
    'round-robin': 'Round Robin',
    'swiss': 'Swiss System'
  };
  
  return formatMap[format] || format;
}

/**
 * Join a tournament
 * @param {string} tournamentId - Tournament ID to join
 * @param {object} dependencies - Required dependencies (socket)
 */
export function joinTournament(tournamentId, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🚪 Joining tournament:', tournamentId);
  
  if (socket && tournamentId) {
    socket.emit('join-tournament', { tournamentId });
  }
}

/**
 * Start a tournament (for organizers)
 * @param {string} tournamentId - Tournament ID to start
 * @param {object} dependencies - Required dependencies (socket)
 */
export function startTournament(tournamentId, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🚀 Starting tournament:', tournamentId);
  
  if (socket && tournamentId) {
    socket.emit('start-tournament', { tournamentId });
  }
}

/**
 * View tournament details and brackets
 * @param {string} tournamentId - Tournament ID to view
 * @param {object} dependencies - Required dependencies (socket)
 */
export function viewTournament(tournamentId, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('👀 Viewing tournament:', tournamentId);
  
  if (socket && tournamentId) {
    socket.emit('get-tournament-details', { tournamentId });
  }
}

/**
 * Update tournament status display
 * @param {object} tournament - Tournament data
 */
export function updateTournamentStatus(tournament) {
  console.log('🔄 Updating tournament status:', tournament);
  
  const statusContainer = getElement('tournament-status-display');
  if (!statusContainer || !tournament) {
    return;
  }
  
  const statusHTML = `
    <div class="tournament-status-info">
      <h3>${tournament.name}</h3>
      <div class="status-details">
        <div class="status-item">
          <span class="status-label">Status:</span>
          <span class="status-value status-${tournament.status}">${formatTournamentStatus(tournament.status)}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Players:</span>
          <span class="status-value">${tournament.players?.length || 0}/${tournament.maxPlayers}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Format:</span>
          <span class="status-value">${formatTournamentFormat(tournament.format)}</span>
        </div>
        ${tournament.currentRound ? `
          <div class="status-item">
            <span class="status-label">Current Round:</span>
            <span class="status-value">${tournament.currentRound}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  setElementHTML(statusContainer, statusHTML);
}

/**
 * Update tournament brackets display
 * @param {object} tournament - Tournament data with brackets
 */
export function updateBracketsDisplay(tournament) {
  console.log('🏆 Updating brackets display:', tournament);
  
  const bracketsContainer = getElement('tournament-brackets');
  if (!bracketsContainer || !tournament.brackets) {
    return;
  }
  
  const bracketsHTML = generateBracketsHTML(tournament.brackets, tournament.format);
  setElementHTML(bracketsContainer, bracketsHTML);
}

/**
 * Generate brackets HTML based on tournament format
 * @param {object} brackets - Tournament brackets data
 * @param {string} format - Tournament format
 * @returns {string} HTML for brackets display
 */
export function generateBracketsHTML(brackets, format) {
  switch (format) {
    case 'single-elimination':
      return generateSingleEliminationBrackets(brackets);
    case 'double-elimination':
      return generateDoubleEliminationBrackets(brackets);
    case 'round-robin':
      return generateRoundRobinTable(brackets);
    case 'swiss':
      return generateSwissTable(brackets);
    default:
      return '<p>Brackets format not supported yet.</p>';
  }
}

/**
 * Generate single elimination brackets HTML
 * @param {object} brackets - Brackets data
 * @returns {string} HTML for single elimination brackets
 */
export function generateSingleEliminationBrackets(brackets) {
  if (!brackets.rounds || brackets.rounds.length === 0) {
    return '<p>No brackets data available.</p>';
  }
  
  let html = '<div class="single-elimination-brackets">';
  
  brackets.rounds.forEach((round, roundIndex) => {
    html += `
      <div class="tournament-round">
        <h4 class="round-title">${getRoundName(roundIndex, brackets.rounds.length)}</h4>
        <div class="round-matches">
          ${round.matches.map(match => `
            <div class="bracket-match ${match.status}">
              <div class="match-players">
                <div class="player ${match.winner === match.player1?.id ? 'winner' : ''}">
                  <span class="player-name">${match.player1?.name || 'TBD'}</span>
                  ${match.score ? `<span class="player-score">${match.score.player1 || 0}</span>` : ''}
                </div>
                <div class="match-vs">vs</div>
                <div class="player ${match.winner === match.player2?.id ? 'winner' : ''}">
                  <span class="player-name">${match.player2?.name || 'TBD'}</span>
                  ${match.score ? `<span class="player-score">${match.score.player2 || 0}</span>` : ''}
                </div>
              </div>
              ${match.status === 'completed' ? `
                <div class="match-result">
                  Winner: ${match.winnerName || 'TBD'}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * Generate double elimination brackets HTML
 * @param {object} brackets - Brackets data
 * @returns {string} HTML for double elimination brackets
 */
export function generateDoubleEliminationBrackets(brackets) {
  let html = '<div class="double-elimination-brackets">';
  
  if (brackets.winnersBracket) {
    html += '<div class="winners-bracket">';
    html += '<h3>Winners Bracket</h3>';
    html += generateSingleEliminationBrackets(brackets.winnersBracket);
    html += '</div>';
  }
  
  if (brackets.losersBracket) {
    html += '<div class="losers-bracket">';
    html += '<h3>Losers Bracket</h3>';
    html += generateSingleEliminationBrackets(brackets.losersBracket);
    html += '</div>';
  }
  
  if (brackets.grandFinal) {
    html += '<div class="grand-final">';
    html += '<h3>Grand Final</h3>';
    html += generateSingleEliminationBrackets({ rounds: [{ matches: [brackets.grandFinal] }] });
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

/**
 * Generate round robin table HTML
 * @param {object} brackets - Brackets data
 * @returns {string} HTML for round robin table
 */
export function generateRoundRobinTable(brackets) {
  if (!brackets.standings) {
    return '<p>No standings data available.</p>';
  }
  
  let html = '<div class="round-robin-table">';
  html += '<h3>Standings</h3>';
  html += '<table class="standings-table">';
  html += '<thead><tr><th>Rank</th><th>Player</th><th>Wins</th><th>Losses</th><th>Points</th></tr></thead>';
  html += '<tbody>';
  
  brackets.standings.forEach((player, index) => {
    html += `
      <tr class="standing-row">
        <td class="rank">${index + 1}</td>
        <td class="player-name">${player.name}</td>
        <td class="wins">${player.wins || 0}</td>
        <td class="losses">${player.losses || 0}</td>
        <td class="points">${player.points || 0}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

/**
 * Generate swiss table HTML
 * @param {object} brackets - Brackets data
 * @returns {string} HTML for swiss table
 */
export function generateSwissTable(brackets) {
  // Similar to round robin but with pairings for each round
  return generateRoundRobinTable(brackets);
}

/**
 * Get round name based on round index and total rounds
 * @param {number} roundIndex - Current round index
 * @param {number} totalRounds - Total number of rounds
 * @returns {string} Round name
 */
export function getRoundName(roundIndex, totalRounds) {
  const roundNames = {
    0: totalRounds === 1 ? 'Final' : 'Round 1',
    1: totalRounds === 2 ? 'Final' : 'Round 2',
    2: totalRounds === 3 ? 'Final' : 'Semi-Final',
    3: 'Final'
  };
  
  if (roundIndex === totalRounds - 1) {
    return 'Final';
  } else if (roundIndex === totalRounds - 2) {
    return 'Semi-Final';
  } else if (roundIndex === totalRounds - 3) {
    return 'Quarter-Final';
  } else {
    return `Round ${roundIndex + 1}`;
  }
}

/**
 * View tournament results
 * @param {string} tournamentId - Tournament ID
 * @param {object} dependencies - Required dependencies (socket)
 */
export function viewTournamentResults(tournamentId, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🏅 Viewing tournament results:', tournamentId);
  
  if (socket && tournamentId) {
    socket.emit('get-tournament-results', { tournamentId });
  }
}

/**
 * Display tournament results
 * @param {object} results - Tournament results data
 */
export function displayTournamentResults(results) {
  console.log('🏅 Displaying tournament results:', results);
  
  const resultsContainer = getElement('tournament-results');
  if (!resultsContainer || !results) {
    return;
  }
  
  const resultsHTML = `
    <div class="tournament-results-display">
      <h3>Tournament Results: ${results.tournamentName}</h3>
      <div class="results-summary">
        <div class="winner-section">
          <h4>🏆 Champion</h4>
          <div class="champion">
            <span class="champion-name">${results.winner?.name || 'TBD'}</span>
            ${results.winner?.prize ? `<span class="champion-prize">Prize: ${results.winner.prize}</span>` : ''}
          </div>
        </div>
        
        <div class="top-players">
          <h4>🏅 Top Players</h4>
          <ol class="final-standings">
            ${results.finalStandings?.map(player => `
              <li class="final-standing">
                <span class="player-name">${player.name}</span>
                <span class="player-record">${player.wins}W - ${player.losses}L</span>
                ${player.prize ? `<span class="player-prize">${player.prize}</span>` : ''}
              </li>
            `).join('') || ''}
          </ol>
        </div>
        
        ${results.stats ? `
          <div class="tournament-stats">
            <h4>📊 Tournament Statistics</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Total Games:</span>
                <span class="stat-value">${results.stats.totalGames}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Duration:</span>
                <span class="stat-value">${formatDuration(results.stats.duration)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Participants:</span>
                <span class="stat-value">${results.stats.participants}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  setElementHTML(resultsContainer, resultsHTML);
}

/**
 * Initialize tournament UI system
 * @param {object} dependencies - Required dependencies (socket)
 */
export function initializeTournamentUI(dependencies = {}) {
  console.log('🏆 Initializing tournament UI...');
  
  // Set up tournament creation form
  const createTournamentBtn = getElement('create-tournament-btn');
  if (createTournamentBtn) {
    createTournamentBtn.addEventListener('click', () => createTournament(dependencies));
  }
  
  // Set up navigation buttons
  const showCreationBtn = getElement('show-tournament-creation-btn');
  if (showCreationBtn) {
    showCreationBtn.addEventListener('click', showTournamentCreation);
  }
  
  const showListBtn = getElement('show-tournament-list-btn');
  if (showListBtn) {
    showListBtn.addEventListener('click', showTournamentList);
  }
  
  // Set up refresh button
  const refreshBtn = getElement('refresh-tournaments-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (dependencies.socket) {
        dependencies.socket.emit('get-tournament-list');
      }
    });
  }
  
  console.log('✅ Tournament UI initialized');
}

/**
 * Handle tournament socket events
 * @param {object} socket - Socket connection
 */
export function setupTournamentSocketHandlers(socket) {
  if (!socket) return;
  
  console.log('🔌 Setting up tournament socket handlers...');
  
  // Tournament list updated
  socket.on('tournament-list', (tournaments) => {
    updateTournamentList(tournaments);
  });
  
  // Tournament created
  socket.on('tournament-created', (tournament) => {
    console.log('✅ Tournament created:', tournament);
    showTournamentList();
  });
  
  // Tournament joined
  socket.on('tournament-joined', (tournament) => {
    console.log('✅ Joined tournament:', tournament);
    updateTournamentStatus(tournament);
  });
  
  // Tournament started
  socket.on('tournament-started', (tournament) => {
    console.log('🚀 Tournament started:', tournament);
    updateTournamentStatus(tournament);
    updateBracketsDisplay(tournament);
  });
  
  // Tournament updated
  socket.on('tournament-updated', (tournament) => {
    console.log('🔄 Tournament updated:', tournament);
    updateTournamentStatus(tournament);
    updateBracketsDisplay(tournament);
  });
  
  // Tournament completed
  socket.on('tournament-completed', (results) => {
    console.log('🏁 Tournament completed:', results);
    displayTournamentResults(results);
  });
  
  console.log('✅ Tournament socket handlers set up');
}

// Global functions for onclick handlers
if (typeof window !== 'undefined') {
  window.joinTournament = (tournamentId) => {
    joinTournament(tournamentId, { socket: window.socket });
  };
  
  window.startTournament = (tournamentId) => {
    startTournament(tournamentId, { socket: window.socket });
  };
  
  window.viewTournament = (tournamentId) => {
    viewTournament(tournamentId, { socket: window.socket });
  };
  
  window.viewTournamentResults = (tournamentId) => {
    viewTournamentResults(tournamentId, { socket: window.socket });
  };
}