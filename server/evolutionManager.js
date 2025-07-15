const { PIECE_TYPES } = require('./pieceTypes');

class EvolutionManager {
    constructor() {
        this.evolutionPaths = this.initializeEvolutionPaths();
        this.pieceTimeTracking = new Map(); // pieceId -> { birthTime, totalAliveTime }
        this.playerEvolutionBanks = new Map(); // playerId -> { points, pendingChoices }
        this.evolutionRequirements = this.initializeEvolutionRequirements();
    }

    // Initialize evolution paths for all piece types
    initializeEvolutionPaths() {
        return {
            'PAWN': [
                {
                    id: 'pawn_to_knight',
                    name: 'Knight Evolution',
                    targetType: 'KNIGHT',
                    cost: 3,
                    timeRequirement: 0, // No time requirement
                    description: 'Evolve to Knight - L-shaped movement',
                    icon: '♞',
                    rarity: 'common'
                },
                {
                    id: 'pawn_to_rook',
                    name: 'Rook Evolution',
                    targetType: 'ROOK',
                    cost: 4,
                    timeRequirement: 60, // 60 seconds alive
                    description: 'Evolve to Rook - Straight line movement',
                    icon: '♜',
                    rarity: 'common'
                },
                {
                    id: 'pawn_to_bishop',
                    name: 'Bishop Evolution',
                    targetType: 'BISHOP',
                    cost: 4,
                    timeRequirement: 60,
                    description: 'Evolve to Bishop - Diagonal movement',
                    icon: '♝',
                    rarity: 'common'
                },
                {
                    id: 'pawn_to_queen',
                    name: 'Queen Evolution',
                    targetType: 'QUEEN',
                    cost: 8,
                    timeRequirement: 300, // 5 minutes alive
                    description: 'Evolve to Queen - Ultimate power',
                    icon: '♛',
                    rarity: 'epic'
                },
                {
                    id: 'pawn_to_splitter',
                    name: 'Splitter Evolution',
                    targetType: 'SPLITTER',
                    cost: 5,
                    timeRequirement: 120, // 2 minutes alive
                    description: 'Evolve to Splitter - Reproduction ability',
                    icon: '⚡',
                    rarity: 'uncommon'
                }
            ],
            'KNIGHT': [
                {
                    id: 'knight_to_super_knight',
                    name: 'Super Knight',
                    targetType: 'SUPER_KNIGHT',
                    cost: 6,
                    timeRequirement: 180,
                    description: 'Enhanced Knight with extended range',
                    icon: '♞⚡',
                    rarity: 'rare'
                },
                {
                    id: 'knight_to_jumper',
                    name: 'Jumper Evolution',
                    targetType: 'JUMPER',
                    cost: 7,
                    timeRequirement: 240,
                    description: 'Evolve to Jumper - Capture by jumping',
                    icon: '🦘',
                    rarity: 'rare'
                }
            ],
            'ROOK': [
                {
                    id: 'rook_to_super_rook',
                    name: 'Super Rook',
                    targetType: 'SUPER_ROOK',
                    cost: 8,
                    timeRequirement: 300,
                    description: 'Enhanced Rook with unlimited range',
                    icon: '♜⚡',
                    rarity: 'rare'
                }
            ],
            'BISHOP': [
                {
                    id: 'bishop_to_super_bishop',
                    name: 'Super Bishop',
                    targetType: 'SUPER_BISHOP',
                    cost: 8,
                    timeRequirement: 300,
                    description: 'Enhanced Bishop with unlimited range',
                    icon: '♝⚡',
                    rarity: 'rare'
                }
            ],
            'QUEEN': [
                {
                    id: 'queen_to_hybrid_queen',
                    name: 'Hybrid Queen',
                    targetType: 'HYBRID_QUEEN',
                    cost: 12,
                    timeRequirement: 600, // 10 minutes alive
                    description: 'Ultimate evolution - Queen + Jumper abilities',
                    icon: '♛🦘',
                    rarity: 'legendary'
                }
            ],
            'SPLITTER': [
                {
                    id: 'splitter_to_super_splitter',
                    name: 'Super Splitter',
                    targetType: 'SUPER_SPLITTER',
                    cost: 10,
                    timeRequirement: 480, // 8 minutes alive
                    description: 'Enhanced Splitter with faster reproduction',
                    icon: '⚡💫',
                    rarity: 'epic'
                }
            ],
            'JUMPER': [
                {
                    id: 'jumper_to_super_jumper',
                    name: 'Super Jumper',
                    targetType: 'SUPER_JUMPER',
                    cost: 10,
                    timeRequirement: 300,
                    description: 'Enhanced Jumper - 2x2 capture area',
                    icon: '🦘⚡',
                    rarity: 'epic'
                }
            ],
            'SUPER_JUMPER': [
                {
                    id: 'super_jumper_to_hyper_jumper',
                    name: 'Hyper Jumper',
                    targetType: 'HYPER_JUMPER',
                    cost: 15,
                    timeRequirement: 600,
                    description: 'Ultimate Jumper - 2x3 capture area',
                    icon: '🦘💫',
                    rarity: 'legendary'
                }
            ],
            'HYPER_JUMPER': [
                {
                    id: 'hyper_jumper_to_mistress_jumper',
                    name: 'Mistress Jumper',
                    targetType: 'MISTRESS_JUMPER',
                    cost: 20,
                    timeRequirement: 900, // 15 minutes alive
                    description: 'Master Jumper - 2x3 + landing capture',
                    icon: '🦘👑',
                    rarity: 'legendary'
                }
            ]
        };
    }

    // Initialize evolution requirements
    initializeEvolutionRequirements() {
        return {
            'SUPER_KNIGHT': { minBattlesWon: 3, minPiecesKilled: 2 },
            'SUPER_ROOK': { minBattlesWon: 5, minPiecesKilled: 3 },
            'SUPER_BISHOP': { minBattlesWon: 5, minPiecesKilled: 3 },
            'HYBRID_QUEEN': { minBattlesWon: 10, minPiecesKilled: 8, minEvolutionPoints: 50 },
            'SUPER_SPLITTER': { minSplits: 5, minTimeAlive: 480 },
            'SUPER_JUMPER': { minJumps: 10, minMultiCaptures: 3 },
            'HYPER_JUMPER': { minJumps: 25, minMultiCaptures: 8 },
            'MISTRESS_JUMPER': { minJumps: 50, minMultiCaptures: 15, minBattlesWon: 15 }
        };
    }

    // Initialize player evolution bank
    initializePlayerBank(playerId) {
        if (!this.playerEvolutionBanks.has(playerId)) {
            this.playerEvolutionBanks.set(playerId, {
                points: 0,
                totalPointsEarned: 0,
                totalPointsSpent: 0,
                pendingChoices: new Map(), // pieceId -> { timestamp, availablePaths }
                evolutionHistory: []
            });
        }
        return this.playerEvolutionBanks.get(playerId);
    }

    // Track piece birth time
    trackPieceBirth(pieceId, piece) {
        this.pieceTimeTracking.set(pieceId, {
            birthTime: new Date(),
            totalAliveTime: 0,
            piece: piece,
            stats: {
                battlesWon: 0,
                piecesKilled: 0,
                jumps: 0,
                multiCaptures: 0,
                splits: 0
            }
        });
    }

    // Update piece statistics
    updatePieceStats(pieceId, statType, value = 1) {
        const tracking = this.pieceTimeTracking.get(pieceId);
        if (tracking) {
            tracking.stats[statType] = (tracking.stats[statType] || 0) + value;
        }
    }

    // Calculate current alive time for a piece
    getPieceAliveTime(pieceId) {
        const tracking = this.pieceTimeTracking.get(pieceId);
        if (!tracking) return 0;
        
        const now = new Date();
        const sessionTime = (now - tracking.birthTime) / 1000; // Convert to seconds
        return tracking.totalAliveTime + sessionTime;
    }

    // Add evolution points to player bank
    addEvolutionPoints(playerId, points, reason = 'gameplay') {
        const bank = this.initializePlayerBank(playerId);
        bank.points += points;
        bank.totalPointsEarned += points;
        
        console.log(`Player ${playerId} gained ${points} evolution points (${reason}). Total: ${bank.points}`);
        
        return bank;
    }

    // Get available evolution paths for a piece
    getAvailableEvolutionPaths(pieceId, piece, playerId) {
        const bank = this.initializePlayerBank(playerId);
        const paths = this.evolutionPaths[piece.type] || [];
        const pieceAliveTime = this.getPieceAliveTime(pieceId);
        const pieceStats = this.pieceTimeTracking.get(pieceId)?.stats || {};
        
        return paths.filter(path => {
            // Check if player has enough points
            if (bank.points < path.cost) return false;
            
            // Check time requirement
            if (pieceAliveTime < path.timeRequirement) return false;
            
            // Check special requirements
            const requirements = this.evolutionRequirements[path.targetType];
            if (requirements) {
                for (const [req, value] of Object.entries(requirements)) {
                    if (req === 'minTimeAlive' && pieceAliveTime < value) return false;
                    if (req === 'minEvolutionPoints' && bank.totalPointsEarned < value) return false;
                    if (pieceStats[req.replace('min', '').toLowerCase()] < value) return false;
                }
            }
            
            return true;
        }).map(path => ({
            ...path,
            currentAliveTime: pieceAliveTime,
            requiredAliveTime: path.timeRequirement,
            canAfford: bank.points >= path.cost,
            meetsRequirements: this.checkEvolutionRequirements(path.targetType, pieceStats, bank, pieceAliveTime)
        }));
    }

    // Check if piece meets evolution requirements
    checkEvolutionRequirements(targetType, pieceStats, bank, aliveTime) {
        const requirements = this.evolutionRequirements[targetType];
        if (!requirements) return true;
        
        for (const [req, value] of Object.entries(requirements)) {
            if (req === 'minTimeAlive' && aliveTime < value) return false;
            if (req === 'minEvolutionPoints' && bank.totalPointsEarned < value) return false;
            
            const statKey = req.replace('min', '').toLowerCase();
            if (pieceStats[statKey] !== undefined && pieceStats[statKey] < value) return false;
        }
        
        return true;
    }

    // Create evolution choice for a piece
    createEvolutionChoice(pieceId, piece, playerId) {
        const availablePaths = this.getAvailableEvolutionPaths(pieceId, piece, playerId);
        
        if (availablePaths.length === 0) {
            return null; // No evolution paths available
        }
        
        const bank = this.initializePlayerBank(playerId);
        const choiceData = {
            pieceId: pieceId,
            piece: piece,
            timestamp: new Date(),
            availablePaths: availablePaths,
            expires: new Date(Date.now() + 30000) // 30 second timeout
        };
        
        bank.pendingChoices.set(pieceId, choiceData);
        
        return choiceData;
    }

    // Process evolution choice
    processEvolutionChoice(playerId, pieceId, pathId) {
        const bank = this.initializePlayerBank(playerId);
        const choice = bank.pendingChoices.get(pieceId);
        
        if (!choice) {
            return { success: false, error: 'No pending evolution choice for this piece' };
        }
        
        if (new Date() > choice.expires) {
            bank.pendingChoices.delete(pieceId);
            return { success: false, error: 'Evolution choice has expired' };
        }
        
        const selectedPath = choice.availablePaths.find(path => path.id === pathId);
        if (!selectedPath) {
            return { success: false, error: 'Invalid evolution path selected' };
        }
        
        // Check if player still has enough points
        if (bank.points < selectedPath.cost) {
            return { success: false, error: 'Not enough evolution points' };
        }
        
        // Deduct points
        bank.points -= selectedPath.cost;
        bank.totalPointsSpent += selectedPath.cost;
        
        // Record evolution in history
        bank.evolutionHistory.push({
            timestamp: new Date(),
            pieceId: pieceId,
            fromType: choice.piece.type,
            toType: selectedPath.targetType,
            cost: selectedPath.cost,
            pathId: pathId
        });
        
        // Clear pending choice
        bank.pendingChoices.delete(pieceId);
        
        return {
            success: true,
            evolution: {
                fromType: choice.piece.type,
                toType: selectedPath.targetType,
                cost: selectedPath.cost,
                newPoints: bank.points
            }
        };
    }

    // Get evolution choice timeout
    getEvolutionChoiceTimeout(playerId, pieceId) {
        const bank = this.playerEvolutionBanks.get(playerId);
        if (!bank) return null;
        
        const choice = bank.pendingChoices.get(pieceId);
        if (!choice) return null;
        
        const timeLeft = choice.expires.getTime() - Date.now();
        return Math.max(0, Math.floor(timeLeft / 1000));
    }

    // Cancel evolution choice
    cancelEvolutionChoice(playerId, pieceId) {
        const bank = this.playerEvolutionBanks.get(playerId);
        if (bank) {
            bank.pendingChoices.delete(pieceId);
            return true;
        }
        return false;
    }

    // Get player evolution bank info
    getPlayerBankInfo(playerId) {
        const bank = this.initializePlayerBank(playerId);
        return {
            points: bank.points,
            totalEarned: bank.totalPointsEarned,
            totalSpent: bank.totalPointsSpent,
            pendingChoices: Array.from(bank.pendingChoices.keys()),
            evolutionHistory: bank.evolutionHistory.slice(-10) // Last 10 evolutions
        };
    }

    // Clean up expired choices
    cleanupExpiredChoices() {
        const now = new Date();
        for (const [playerId, bank] of this.playerEvolutionBanks) {
            for (const [pieceId, choice] of bank.pendingChoices) {
                if (now > choice.expires) {
                    bank.pendingChoices.delete(pieceId);
                    console.log(`Expired evolution choice for piece ${pieceId}`);
                }
            }
        }
    }

    // Handle piece death - clean up tracking
    handlePieceDeath(pieceId) {
        this.pieceTimeTracking.delete(pieceId);
        
        // Clean up any pending choices for this piece
        for (const [playerId, bank] of this.playerEvolutionBanks) {
            if (bank.pendingChoices.has(pieceId)) {
                bank.pendingChoices.delete(pieceId);
            }
        }
    }

    // Get evolution leaderboard
    getEvolutionLeaderboard(limit = 10) {
        const players = Array.from(this.playerEvolutionBanks.entries())
            .map(([playerId, bank]) => ({
                playerId,
                totalEarned: bank.totalPointsEarned,
                totalSpent: bank.totalPointsSpent,
                efficiency: bank.totalPointsSpent / Math.max(bank.totalPointsEarned, 1),
                evolutionCount: bank.evolutionHistory.length
            }))
            .sort((a, b) => b.totalEarned - a.totalEarned)
            .slice(0, limit);
        
        return players;
    }

    // Get evolution statistics
    getEvolutionStats() {
        let totalPoints = 0;
        let totalEvolutions = 0;
        let totalPlayers = 0;
        
        for (const [playerId, bank] of this.playerEvolutionBanks) {
            totalPlayers++;
            totalPoints += bank.totalPointsEarned;
            totalEvolutions += bank.evolutionHistory.length;
        }
        
        return {
            totalPlayers,
            totalPoints,
            totalEvolutions,
            averagePointsPerPlayer: totalPoints / Math.max(totalPlayers, 1),
            averageEvolutionsPerPlayer: totalEvolutions / Math.max(totalPlayers, 1),
            activePieces: this.pieceTimeTracking.size
        };
    }

    // Setup cleanup interval
    setupCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredChoices();
        }, 5000); // Clean up every 5 seconds
    }
}

module.exports = EvolutionManager; 