// Globe Chess Tournament Management System
// Handles tournament creation, bracket management, and match progression

const TOURNAMENT_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const MATCH_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

class TournamentManager {
  constructor() {
    this.tournaments = new Map();
    this.activeTournament = null;
  }

  // Create a new tournament
  createTournament(settings = {}) {
    const tournamentId = `tournament_${Date.now()}`;
    const tournament = {
      id: tournamentId,
      name: settings.name || `Globe Chess Tournament ${new Date().toLocaleString()}`,
      maxPlayers: settings.maxPlayers || 8,
      minPlayers: settings.minPlayers || 2,
      type: settings.type || 'single_elimination',
      status: TOURNAMENT_STATUS.WAITING,
      players: [],
      brackets: [],
      currentRound: 0,
      winner: null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      settings: {
        timeLimit: settings.timeLimit || 300000, // 5 minutes per game
        evolutionPointsStart: settings.evolutionPointsStart || 0,
        ...settings
      }
    };

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  // Register a player for a tournament
  registerPlayer(tournamentId, playerId, playerName) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    if (tournament.status !== TOURNAMENT_STATUS.WAITING) {
      return { success: false, error: 'Tournament registration is closed' };
    }

    if (tournament.players.length >= tournament.maxPlayers) {
      return { success: false, error: 'Tournament is full' };
    }

    if (tournament.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Player already registered' };
    }

    const player = {
      id: playerId,
      name: playerName,
      registeredAt: new Date(),
      eliminated: false,
      wins: 0,
      losses: 0,
      totalGames: 0
    };

    tournament.players.push(player);
    
    // Auto-start if minimum players reached and tournament is set to auto-start
    if (tournament.players.length >= tournament.minPlayers && tournament.settings.autoStart) {
      this.startTournament(tournamentId);
    }

    return { success: true, player, tournament };
  }

  // Start a tournament
  startTournament(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    if (tournament.status !== TOURNAMENT_STATUS.WAITING) {
      return { success: false, error: 'Tournament cannot be started' };
    }

    if (tournament.players.length < tournament.minPlayers) {
      return { success: false, error: `Need at least ${tournament.minPlayers} players` };
    }

    // Generate brackets
    const brackets = this.generateBrackets(tournament);
    tournament.brackets = brackets;
    tournament.status = TOURNAMENT_STATUS.ACTIVE;
    tournament.startedAt = new Date();
    tournament.currentRound = 1;
    this.activeTournament = tournament;

    return { success: true, tournament };
  }

  // Generate tournament brackets
  generateBrackets(tournament) {
    const players = [...tournament.players];
    const brackets = [];
    
    // Shuffle players for random seeding
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    // Calculate total rounds needed
    const totalRounds = Math.ceil(Math.log2(players.length));
    
    // Generate first round matches
    let currentRound = 1;
    let roundMatches = [];
    
    // Pair players for first round
    for (let i = 0; i < players.length; i += 2) {
      const player1 = players[i];
      const player2 = players[i + 1];
      
      if (player2) {
        // Standard match
        roundMatches.push({
          id: `match_${currentRound}_${Math.floor(i / 2) + 1}`,
          round: currentRound,
          player1: player1,
          player2: player2,
          winner: null,
          status: MATCH_STATUS.PENDING,
          gameId: null,
          startedAt: null,
          completedAt: null
        });
      } else {
        // Bye (odd number of players)
        roundMatches.push({
          id: `bye_${currentRound}_${Math.floor(i / 2) + 1}`,
          round: currentRound,
          player1: player1,
          player2: null,
          winner: player1,
          status: MATCH_STATUS.COMPLETED,
          gameId: null,
          startedAt: new Date(),
          completedAt: new Date(),
          isBye: true
        });
      }
    }

    brackets.push({
      round: currentRound,
      matches: roundMatches,
      name: `Round ${currentRound}`,
      status: MATCH_STATUS.PENDING
    });

    // Generate subsequent rounds (empty for now)
    for (let round = 2; round <= totalRounds; round++) {
      const previousRoundMatches = brackets[round - 2].matches;
      const nextRoundMatches = [];
      
      for (let i = 0; i < previousRoundMatches.length; i += 2) {
        nextRoundMatches.push({
          id: `match_${round}_${Math.floor(i / 2) + 1}`,
          round: round,
          player1: null, // Will be filled when previous round completes
          player2: null,
          winner: null,
          status: MATCH_STATUS.PENDING,
          gameId: null,
          startedAt: null,
          completedAt: null
        });
      }

      brackets.push({
        round: round,
        matches: nextRoundMatches,
        name: round === totalRounds ? 'Final' : `Round ${round}`,
        status: MATCH_STATUS.PENDING
      });
    }

    return brackets;
  }

  // Get next pending match for a tournament
  getNextMatch(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament || tournament.status !== TOURNAMENT_STATUS.ACTIVE) {
      return null;
    }

    const currentRoundBracket = tournament.brackets[tournament.currentRound - 1];
    if (!currentRoundBracket) return null;

    return currentRoundBracket.matches.find(match => 
      match.status === MATCH_STATUS.PENDING && !match.isBye
    );
  }

  // Report match result
  reportMatchResult(tournamentId, matchId, winnerId, gameData = {}) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    // Find the match
    let match = null;
    let roundIndex = -1;
    
    for (let i = 0; i < tournament.brackets.length; i++) {
      const foundMatch = tournament.brackets[i].matches.find(m => m.id === matchId);
      if (foundMatch) {
        match = foundMatch;
        roundIndex = i;
        break;
      }
    }

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    if (match.status !== MATCH_STATUS.ACTIVE) {
      return { success: false, error: 'Match is not active' };
    }

    // Validate winner
    if (winnerId !== match.player1.id && winnerId !== match.player2.id) {
      return { success: false, error: 'Invalid winner' };
    }

    // Update match
    match.winner = winnerId === match.player1.id ? match.player1 : match.player2;
    match.status = MATCH_STATUS.COMPLETED;
    match.completedAt = new Date();
    match.gameData = gameData;

    // Update player stats
    const winner = match.winner;
    const loser = winnerId === match.player1.id ? match.player2 : match.player1;
    
    winner.wins++;
    winner.totalGames++;
    loser.losses++;
    loser.totalGames++;
    loser.eliminated = true;

    // Check if round is complete
    const currentRound = tournament.brackets[roundIndex];
    const roundComplete = currentRound.matches.every(m => m.status === MATCH_STATUS.COMPLETED);

    if (roundComplete) {
      // Advance to next round
      this.advanceToNextRound(tournament, roundIndex);
    }

    return { success: true, match, tournament };
  }

  // Advance tournament to next round
  advanceToNextRound(tournament, completedRoundIndex) {
    const completedRound = tournament.brackets[completedRoundIndex];
    const nextRoundIndex = completedRoundIndex + 1;
    
    if (nextRoundIndex >= tournament.brackets.length) {
      // Tournament complete
      const finalMatch = completedRound.matches[0];
      tournament.winner = finalMatch.winner;
      tournament.status = TOURNAMENT_STATUS.COMPLETED;
      tournament.completedAt = new Date();
      this.activeTournament = null;
      return;
    }

    // Fill next round with winners
    const nextRound = tournament.brackets[nextRoundIndex];
    const winners = completedRound.matches.map(match => match.winner);
    
    let winnerIndex = 0;
    for (let match of nextRound.matches) {
      if (winners[winnerIndex]) {
        match.player1 = winners[winnerIndex];
        winnerIndex++;
      }
      if (winners[winnerIndex]) {
        match.player2 = winners[winnerIndex];
        winnerIndex++;
      }
    }

    tournament.currentRound++;
    completedRound.status = MATCH_STATUS.COMPLETED;
  }

  // Get tournament info
  getTournament(tournamentId) {
    return this.tournaments.get(tournamentId);
  }

  // Get all tournaments
  getAllTournaments() {
    return Array.from(this.tournaments.values());
  }

  // Get active tournament
  getActiveTournament() {
    return this.activeTournament;
  }

  // Cancel tournament
  cancelTournament(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    tournament.status = TOURNAMENT_STATUS.CANCELLED;
    if (this.activeTournament && this.activeTournament.id === tournamentId) {
      this.activeTournament = null;
    }

    return { success: true, tournament };
  }

  // Get tournament statistics
  getTournamentStats(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;

    return {
      totalPlayers: tournament.players.length,
      completedMatches: tournament.brackets.reduce((count, round) => 
        count + round.matches.filter(m => m.status === MATCH_STATUS.COMPLETED).length, 0),
      totalMatches: tournament.brackets.reduce((count, round) => count + round.matches.length, 0),
      currentRound: tournament.currentRound,
      totalRounds: tournament.brackets.length,
      duration: tournament.completedAt ? 
        tournament.completedAt - tournament.startedAt : 
        (tournament.startedAt ? Date.now() - tournament.startedAt : 0)
    };
  }

  // Get tournament leaderboard
  getTournamentLeaderboard(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;

    const leaderboard = tournament.players
      .sort((a, b) => {
        // Sort by wins first, then by total games
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalGames - a.totalGames;
      })
      .map((player, index) => ({
        rank: index + 1,
        name: player.name,
        wins: player.wins,
        losses: player.losses,
        totalGames: player.totalGames,
        winRate: player.totalGames > 0 ? (player.wins / player.totalGames * 100).toFixed(1) : '0.0',
        isChampion: tournament.winner && tournament.winner.id === player.id,
        eliminated: player.eliminated
      }));

    return leaderboard;
  }

  // Award tournament prizes
  awardTournamentPrizes(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament || tournament.status !== TOURNAMENT_STATUS.COMPLETED) return null;

    const prizes = {
      champion: {
        player: tournament.winner,
        prize: 'Globe Chess Tournament Champion',
        evolutionPoints: 50,
        title: '🏆 Champion'
      },
      // Add more prize tiers if needed
    };

    return prizes;
  }
}

module.exports = { TournamentManager, TOURNAMENT_STATUS, MATCH_STATUS }; 