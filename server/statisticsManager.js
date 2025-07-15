const fs = require('fs');
const path = require('path');

class StatisticsManager {
    constructor() {
        this.playerStats = new Map(); // playerId -> stats object
        this.gameHistory = []; // Array of completed games
        this.seasonStats = new Map(); // playerId -> season stats
        this.achievements = new Map(); // playerId -> achievements array
        this.dataFile = path.join(__dirname, '../data/player-stats.json');
        this.gameHistoryFile = path.join(__dirname, '../data/game-history.json');
        
        this.loadData();
        this.setupCleanupInterval();
    }

    // Initialize or get player statistics
    initPlayerStats(playerId, playerName) {
        if (!this.playerStats.has(playerId)) {
            const stats = {
                playerId: playerId,
                playerName: playerName,
                created: new Date(),
                lastPlayed: new Date(),
                
                // Game Statistics
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0,
                averageGameDuration: 0,
                
                // Battle Statistics
                battlesInitiated: 0,
                battlesWon: 0,
                battlesLost: 0,
                battleWinRate: 0,
                averageBattleTime: 0,
                
                // Piece Statistics
                piecesLost: 0,
                piecesKilled: 0,
                killDeathRatio: 0,
                piecesEvolved: 0,
                evolutionPoints: 0,
                totalEvolutionPoints: 0,
                
                // Movement Statistics
                movesMade: 0,
                averageMovesPerGame: 0,
                capturesMade: 0,
                capturesReceived: 0,
                
                // Special Abilities
                splitterUses: 0,
                jumperMultiCaptures: 0,
                hybridQueenModeChanges: 0,
                equatorBonuses: 0,
                circumnavigations: 0,
                
                // Tournament Statistics
                tournamentsJoined: 0,
                tournamentWins: 0,
                tournamentFinals: 0,
                tournamentSemifinals: 0,
                
                // Streak Statistics
                currentWinStreak: 0,
                bestWinStreak: 0,
                currentLossStreak: 0,
                worstLossStreak: 0,
                
                // Time Statistics
                totalPlayTime: 0,
                averageSessionTime: 0,
                longestSession: 0,
                
                // Ranking
                currentRank: 1000, // Starting ELO-like rating
                bestRank: 1000,
                rankHistory: [],
                
                // Achievements
                achievements: [],
                
                // Recent Performance (last 10 games)
                recentGames: []
            };
            
            this.playerStats.set(playerId, stats);
        }
        
        return this.playerStats.get(playerId);
    }

    // Record game start
    recordGameStart(playerId, gameId, gameMode = 'standard') {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        
        stats.gamesPlayed++;
        stats.lastPlayed = new Date();
        
        // Create game session
        const gameSession = {
            gameId: gameId,
            startTime: new Date(),
            gameMode: gameMode,
            moves: 0,
            battles: 0,
            evolutionPoints: 0,
            pieces: {
                lost: 0,
                killed: 0,
                evolved: 0
            }
        };
        
        stats.currentSession = gameSession;
        this.saveData();
    }

    // Record game end
    recordGameEnd(playerId, gameId, result, duration, finalStats = {}) {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        
        // Update game results
        if (result === 'win') {
            stats.gamesWon++;
            stats.currentWinStreak++;
            stats.currentLossStreak = 0;
            stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
        } else if (result === 'loss') {
            stats.gamesLost++;
            stats.currentLossStreak++;
            stats.currentWinStreak = 0;
            stats.worstLossStreak = Math.max(stats.worstLossStreak, stats.currentLossStreak);
        }
        
        // Update win rate
        stats.winRate = stats.gamesWon / stats.gamesPlayed;
        
        // Update average game duration
        stats.averageGameDuration = (stats.averageGameDuration * (stats.gamesPlayed - 1) + duration) / stats.gamesPlayed;
        
        // Update session statistics
        if (stats.currentSession) {
            const session = stats.currentSession;
            session.endTime = new Date();
            session.duration = duration;
            session.result = result;
            session.finalStats = finalStats;
            
            // Update totals from session
            stats.movesMade += session.moves;
            stats.battlesInitiated += session.battles;
            stats.evolutionPoints += session.evolutionPoints;
            stats.totalEvolutionPoints += session.evolutionPoints;
            
            // Update averages
            stats.averageMovesPerGame = stats.movesMade / stats.gamesPlayed;
            
            // Add to recent games
            stats.recentGames.unshift({
                gameId: gameId,
                date: new Date(),
                result: result,
                duration: duration,
                moves: session.moves,
                battles: session.battles,
                gameMode: session.gameMode
            });
            
            // Keep only last 10 games
            if (stats.recentGames.length > 10) {
                stats.recentGames = stats.recentGames.slice(0, 10);
            }
            
            delete stats.currentSession;
        }
        
        // Update play time
        stats.totalPlayTime += duration;
        
        // Update ranking
        this.updatePlayerRanking(playerId, result, finalStats);
        
        // Check for achievements
        this.checkAchievements(playerId);
        
        // Record in game history
        this.recordGameHistory(gameId, {
            playerId: playerId,
            result: result,
            duration: duration,
            stats: finalStats
        });
        
        this.saveData();
    }

    // Record battle result
    recordBattle(playerId, battleType, result, opponent, duration = 0) {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        
        stats.battlesInitiated++;
        if (stats.currentSession) {
            stats.currentSession.battles++;
        }
        
        if (result === 'win') {
            stats.battlesWon++;
            stats.piecesKilled++;
        } else if (result === 'loss') {
            stats.battlesLost++;
            stats.piecesLost++;
        }
        
        // Update battle statistics
        stats.battleWinRate = stats.battlesWon / stats.battlesInitiated;
        stats.killDeathRatio = stats.piecesKilled / Math.max(stats.piecesLost, 1);
        
        if (duration > 0) {
            stats.averageBattleTime = (stats.averageBattleTime * (stats.battlesInitiated - 1) + duration) / stats.battlesInitiated;
        }
        
        this.saveData();
    }

    // Record piece evolution
    recordEvolution(playerId, pieceType, newType, evolutionCost) {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        
        stats.piecesEvolved++;
        stats.evolutionPoints -= evolutionCost;
        
        if (stats.currentSession) {
            stats.currentSession.pieces.evolved++;
        }
        
        this.saveData();
    }

    // Record special ability use
    recordSpecialAbility(playerId, abilityType, details = {}) {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        
        switch (abilityType) {
            case 'splitter':
                stats.splitterUses++;
                break;
            case 'multi-capture':
                stats.jumperMultiCaptures++;
                break;
            case 'hybrid-queen-mode':
                stats.hybridQueenModeChanges++;
                break;
            case 'equator-bonus':
                stats.equatorBonuses++;
                break;
            case 'circumnavigation':
                stats.circumnavigations++;
                break;
        }
        
        this.saveData();
    }

    // Record tournament participation
    recordTournament(playerId, tournamentId, result, placement) {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        
        stats.tournamentsJoined++;
        
        if (result === 'win') {
            stats.tournamentWins++;
        }
        
        if (placement <= 2) {
            stats.tournamentFinals++;
        }
        
        if (placement <= 4) {
            stats.tournamentSemifinals++;
        }
        
        this.saveData();
    }

    // Update player ranking using ELO-like system
    updatePlayerRanking(playerId, result, gameStats = {}) {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        const K = 32; // K-factor for rating adjustment
        
        // Calculate expected score based on opponent strength
        let expectedScore = 0.5; // Default for unknown opponents
        
        // Adjust rating based on result
        let actualScore = 0;
        if (result === 'win') actualScore = 1;
        else if (result === 'draw') actualScore = 0.5;
        
        // Calculate new rating
        const ratingChange = Math.round(K * (actualScore - expectedScore));
        const newRating = Math.max(0, stats.currentRank + ratingChange);
        
        // Update ranking
        stats.currentRank = newRating;
        stats.bestRank = Math.max(stats.bestRank, newRating);
        
        // Record ranking history
        stats.rankHistory.push({
            date: new Date(),
            rank: newRating,
            change: ratingChange,
            reason: result
        });
        
        // Keep only last 50 rank changes
        if (stats.rankHistory.length > 50) {
            stats.rankHistory = stats.rankHistory.slice(-50);
        }
    }

    // Check for achievements
    checkAchievements(playerId) {
        const stats = this.initPlayerStats(playerId, this.getPlayerName(playerId));
        const achievements = this.getAchievementDefinitions();
        
        for (const achievement of achievements) {
            // Skip if already earned
            if (stats.achievements.some(a => a.id === achievement.id)) {
                continue;
            }
            
            // Check if achievement is earned
            if (achievement.condition(stats)) {
                stats.achievements.push({
                    id: achievement.id,
                    name: achievement.name,
                    description: achievement.description,
                    icon: achievement.icon,
                    rarity: achievement.rarity,
                    earned: new Date()
                });
                
                console.log(`Achievement unlocked: ${achievement.name} for player ${playerId}`);
            }
        }
    }

    // Get achievement definitions
    getAchievementDefinitions() {
        return [
            {
                id: 'first_win',
                name: 'First Victory',
                description: 'Win your first game',
                icon: '🏆',
                rarity: 'common',
                condition: (stats) => stats.gamesWon >= 1
            },
            {
                id: 'win_streak_5',
                name: 'On Fire',
                description: 'Win 5 games in a row',
                icon: '🔥',
                rarity: 'uncommon',
                condition: (stats) => stats.currentWinStreak >= 5
            },
            {
                id: 'evolution_master',
                name: 'Evolution Master',
                description: 'Evolve 50 pieces',
                icon: '🧬',
                rarity: 'rare',
                condition: (stats) => stats.piecesEvolved >= 50
            },
            {
                id: 'battle_veteran',
                name: 'Battle Veteran',
                description: 'Win 100 battles',
                icon: '⚔️',
                rarity: 'epic',
                condition: (stats) => stats.battlesWon >= 100
            },
            {
                id: 'perfect_game',
                name: 'Flawless Victory',
                description: 'Win a game without losing any pieces',
                icon: '💎',
                rarity: 'legendary',
                condition: (stats) => stats.recentGames.some(g => g.result === 'win' && g.piecesLost === 0)
            },
            {
                id: 'tournament_champion',
                name: 'Tournament Champion',
                description: 'Win 3 tournaments',
                icon: '👑',
                rarity: 'legendary',
                condition: (stats) => stats.tournamentWins >= 3
            },
            {
                id: 'globe_explorer',
                name: 'Globe Explorer',
                description: 'Complete 10 circumnavigations',
                icon: '🌍',
                rarity: 'rare',
                condition: (stats) => stats.circumnavigations >= 10
            },
            {
                id: 'hybrid_master',
                name: 'Hybrid Master',
                description: 'Change Hybrid Queen modes 25 times',
                icon: '🔄',
                rarity: 'uncommon',
                condition: (stats) => stats.hybridQueenModeChanges >= 25
            }
        ];
    }

    // Get leaderboard
    getLeaderboard(category = 'rating', limit = 100) {
        const players = Array.from(this.playerStats.values())
            .filter(stats => stats.gamesPlayed > 0)
            .sort((a, b) => {
                switch (category) {
                    case 'rating':
                        return b.currentRank - a.currentRank;
                    case 'wins':
                        return b.gamesWon - a.gamesWon;
                    case 'winRate':
                        return b.winRate - a.winRate;
                    case 'battles':
                        return b.battlesWon - a.battlesWon;
                    case 'evolution':
                        return b.piecesEvolved - a.piecesEvolved;
                    case 'tournaments':
                        return b.tournamentWins - a.tournamentWins;
                    default:
                        return b.currentRank - a.currentRank;
                }
            })
            .slice(0, limit);
        
        return players.map((stats, index) => ({
            rank: index + 1,
            playerId: stats.playerId,
            playerName: stats.playerName,
            value: this.getLeaderboardValue(stats, category),
            stats: {
                gamesPlayed: stats.gamesPlayed,
                gamesWon: stats.gamesWon,
                winRate: (stats.winRate * 100).toFixed(1),
                currentRank: stats.currentRank,
                battlesWon: stats.battlesWon,
                piecesEvolved: stats.piecesEvolved,
                tournamentWins: stats.tournamentWins
            }
        }));
    }

    // Get leaderboard value for specific category
    getLeaderboardValue(stats, category) {
        switch (category) {
            case 'rating':
                return stats.currentRank;
            case 'wins':
                return stats.gamesWon;
            case 'winRate':
                return `${(stats.winRate * 100).toFixed(1)}%`;
            case 'battles':
                return stats.battlesWon;
            case 'evolution':
                return stats.piecesEvolved;
            case 'tournaments':
                return stats.tournamentWins;
            default:
                return stats.currentRank;
        }
    }

    // Get player statistics
    getPlayerStats(playerId) {
        return this.playerStats.get(playerId) || null;
    }

    // Get player rank
    getPlayerRank(playerId, category = 'rating') {
        const leaderboard = this.getLeaderboard(category, 1000);
        const playerEntry = leaderboard.find(entry => entry.playerId === playerId);
        return playerEntry ? playerEntry.rank : null;
    }

    // Record game history
    recordGameHistory(gameId, playerResults) {
        const gameRecord = {
            gameId: gameId,
            timestamp: new Date(),
            players: Array.isArray(playerResults) ? playerResults : [playerResults],
            duration: playerResults.duration || 0,
            gameMode: playerResults.gameMode || 'standard'
        };
        
        this.gameHistory.push(gameRecord);
        
        // Keep only last 1000 games
        if (this.gameHistory.length > 1000) {
            this.gameHistory = this.gameHistory.slice(-1000);
        }
    }

    // Get game history
    getGameHistory(limit = 50) {
        return this.gameHistory.slice(-limit).reverse();
    }

    // Get global statistics
    getGlobalStats() {
        const players = Array.from(this.playerStats.values());
        
        return {
            totalPlayers: players.length,
            totalGames: players.reduce((sum, p) => sum + p.gamesPlayed, 0),
            totalBattles: players.reduce((sum, p) => sum + p.battlesInitiated, 0),
            totalEvolutions: players.reduce((sum, p) => sum + p.piecesEvolved, 0),
            totalTournaments: players.reduce((sum, p) => sum + p.tournamentsJoined, 0),
            averageRating: players.reduce((sum, p) => sum + p.currentRank, 0) / players.length,
            topPlayer: players.reduce((top, p) => p.currentRank > top.currentRank ? p : top, players[0])
        };
    }

    // Helper method to get player name
    getPlayerName(playerId) {
        const stats = this.playerStats.get(playerId);
        return stats ? stats.playerName : `Player ${playerId.substring(0, 6)}`;
    }

    // Load data from file
    loadData() {
        try {
            // Ensure data directory exists
            const dataDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Load player stats
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.playerStats = new Map(data.playerStats || []);
                
                // Convert date strings back to Date objects
                for (const [playerId, stats] of this.playerStats) {
                    stats.created = new Date(stats.created);
                    stats.lastPlayed = new Date(stats.lastPlayed);
                    if (stats.rankHistory) {
                        stats.rankHistory = stats.rankHistory.map(r => ({
                            ...r,
                            date: new Date(r.date)
                        }));
                    }
                    if (stats.achievements) {
                        stats.achievements = stats.achievements.map(a => ({
                            ...a,
                            earned: new Date(a.earned)
                        }));
                    }
                }
            }
            
            // Load game history
            if (fs.existsSync(this.gameHistoryFile)) {
                const historyData = JSON.parse(fs.readFileSync(this.gameHistoryFile, 'utf8'));
                this.gameHistory = historyData.map(game => ({
                    ...game,
                    timestamp: new Date(game.timestamp)
                }));
            }
            
            console.log(`Loaded statistics for ${this.playerStats.size} players`);
        } catch (error) {
            console.error('Error loading statistics data:', error);
        }
    }

    // Save data to file
    saveData() {
        try {
            const data = {
                playerStats: Array.from(this.playerStats.entries()),
                lastUpdated: new Date()
            };
            
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            fs.writeFileSync(this.gameHistoryFile, JSON.stringify(this.gameHistory, null, 2));
        } catch (error) {
            console.error('Error saving statistics data:', error);
        }
    }

    // Setup cleanup interval
    setupCleanupInterval() {
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000);
    }

    // Clean up old data
    cleanupOldData() {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        // Remove players who haven't played in over a year
        for (const [playerId, stats] of this.playerStats) {
            if (stats.lastPlayed < oneYearAgo && stats.gamesPlayed === 0) {
                this.playerStats.delete(playerId);
            }
        }
        
        // Remove old game history
        this.gameHistory = this.gameHistory.filter(game => game.timestamp > oneYearAgo);
        
        this.saveData();
    }
}

module.exports = StatisticsManager; 