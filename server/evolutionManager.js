const { PIECE_TYPES } = require('./pieceTypes');

class EvolutionManager {
    constructor() {
        this.evolutionPaths = this.initializeEvolutionPaths();
        console.log('🎯 PHASE 5 DEBUG: Evolution paths initialized:', Object.keys(this.evolutionPaths));
        console.log('🎯 PHASE 5 DEBUG: PAWN paths:', this.evolutionPaths['PAWN'] ? this.evolutionPaths['PAWN'].length : 'NOT FOUND');
        this.pieceTimeTracking = new Map(); // pieceId -> { birthTime, totalAliveTime }
        this.playerEvolutionBanks = new Map(); // playerId -> { points, pendingChoices }
        this.evolutionRequirements = this.initializeEvolutionRequirements();
    }

    // Initialize evolution paths for all piece types
    initializeEvolutionPaths() {
        // ✅ PHASE 6: Point-based evolution system
        // Players can evolve to ANY piece that costs <= their evolution points
        console.log('🎯 PHASE 6: Initializing point-based evolution system');
        
        return {
            'PAWN': [
                // 2 Points
                {
                    id: 'pawn_to_splitter',
                    name: 'Splitter',
                    targetType: 'SPLITTER',
                    cost: 2,
                    points: 2,
                    description: 'Can split into two pieces',
                    icon: '⚡',
                    rarity: 'common'
                },
                // 3 Points
                {
                    id: 'pawn_to_bishop',
                    name: 'Bishop',
                    targetType: 'BISHOP',
                    cost: 3,
                    points: 3,
                    description: 'Diagonal movement',
                    icon: '♗',
                    rarity: 'common'
                },
                {
                    id: 'pawn_to_knight',
                    name: 'Knight',
                    targetType: 'KNIGHT',
                    cost: 3,
                    points: 3,
                    description: 'L-shaped movement',
                    icon: '♘',
                    rarity: 'common'
                },
                // 4 Points
                {
                    id: 'pawn_to_vaultbound',
                    name: 'Vaultbound',
                    targetType: 'VAULTBOUND',
                    cost: 4,
                    points: 4,
                    description: 'Enhanced jumping ability',
                    icon: '🦘',
                    rarity: 'uncommon'
                },
                // 5 Points
                {
                    id: 'pawn_to_rook',
                    name: 'Rook',
                    targetType: 'ROOK',
                    cost: 5,
                    points: 5,
                    description: 'Straight line movement',
                    icon: '♜',
                    rarity: 'common'
                },
                // 7 Points
                {
                    id: 'pawn_to_vaultseer',
                    name: 'Vaultseer',
                    targetType: 'VAULTSEER',
                    cost: 7,
                    points: 7,
                    description: 'Advanced jumping ability',
                    icon: '🦘✨',
                    rarity: 'rare'
                },
                // 9 Points
                {
                    id: 'pawn_to_queen',
                    name: 'Queen',
                    targetType: 'QUEEN',
                    cost: 9,
                    points: 9,
                    description: 'Ultimate power - all directions',
                    icon: '♛',
                    rarity: 'epic'
                },
                {
                    id: 'pawn_to_vaultarcher',
                    name: 'Vaultarcher',
                    targetType: 'VAULTARCHER',
                    cost: 9,
                    points: 9,
                    description: 'Master jumping ability',
                    icon: '🦘🏹',
                    rarity: 'epic'
                },
                // 10 Points
                {
                    id: 'pawn_to_vaultmistress',
                    name: 'Vaultmistress',
                    targetType: 'VAULTMISTRESS',
                    cost: 10,
                    points: 10,
                    description: 'Supreme jumping mastery',
                    icon: '🦘👑',
                    rarity: 'legendary'
                },
                // 12 Points
                {
                    id: 'pawn_to_covenant_queen',
                    name: 'Covenant Queen',
                    targetType: 'COVENANT_QUEEN',
                    cost: 12,
                    points: 12,
                    description: 'Ultimate evolution - Queen + Jump',
                    icon: '♛🦘',
                    rarity: 'legendary'
                }
            ],
            // For ALL other pieces, they can evolve to any piece of higher value
            'SPLITTER': this.getEvolutionOptionsForPoints(2),
            'BISHOP': this.getEvolutionOptionsForPoints(3),
            'KNIGHT': this.getEvolutionOptionsForPoints(3),
            'VAULTBOUND': this.getEvolutionOptionsForPoints(4),
            'ROOK': this.getEvolutionOptionsForPoints(5),
            'VAULTSEER': this.getEvolutionOptionsForPoints(7),
            'QUEEN': this.getEvolutionOptionsForPoints(9),
            'VAULTARCHER': this.getEvolutionOptionsForPoints(9),
            'VAULTMISTRESS': this.getEvolutionOptionsForPoints(10),
            'COVENANT_QUEEN': [] // Cannot evolve further
        };
    }

    // Helper method to get evolution options based on current piece value
    getEvolutionOptionsForPoints(currentValue) {
        const options = [];
        const allPieces = [
            { type: 'SPLITTER', name: 'Splitter', value: 2, icon: '⚡', desc: 'Can split into two pieces' },
            { type: 'BISHOP', name: 'Bishop', value: 3, icon: '♗', desc: 'Diagonal movement' },
            { type: 'KNIGHT', name: 'Knight', value: 3, icon: '♘', desc: 'L-shaped movement' },
            { type: 'VAULTBOUND', name: 'Vaultbound', value: 4, icon: '🦘', desc: 'Enhanced jumping ability' },
            { type: 'ROOK', name: 'Rook', value: 5, icon: '♜', desc: 'Straight line movement' },
            { type: 'VAULTSEER', name: 'Vaultseer', value: 7, icon: '🦘✨', desc: 'Advanced jumping ability' },
            { type: 'QUEEN', name: 'Queen', value: 9, icon: '♛', desc: 'Ultimate power - all directions' },
            { type: 'VAULTARCHER', name: 'Vaultarcher', value: 9, icon: '🦘🏹', desc: 'Master jumping ability' },
            { type: 'VAULTMISTRESS', name: 'Vaultmistress', value: 10, icon: '🦘👑', desc: 'Supreme jumping mastery' },
            { type: 'COVENANT_QUEEN', name: 'Covenant Queen', value: 12, icon: '♛🦘', desc: 'Ultimate evolution' }
        ];

        // Add all pieces that cost more than current value
        for (const piece of allPieces) {
            if (piece.value > currentValue) {
                options.push({
                    id: `evolve_to_${piece.type.toLowerCase()}`,
                    name: piece.name,
                    targetType: piece.type,
                    cost: piece.value,
                    points: piece.value,
                    description: piece.desc,
                    icon: piece.icon,
                    rarity: piece.value >= 10 ? 'legendary' : piece.value >= 7 ? 'epic' : piece.value >= 4 ? 'rare' : 'common'
                });
            }
        }

        return options.sort((a, b) => a.cost - b.cost);
    }

    // Initialize evolution requirements
    initializeEvolutionRequirements() {
        return {
            'SUPER_KNIGHT': { minBattlesWon: 3, minPiecesKilled: 2 },
            'SUPER_ROOK': { minBattlesWon: 5, minPiecesKilled: 3 },
            'SUPER_BISHOP': { minBattlesWon: 5, minPiecesKilled: 3 },
            'HYBRID_QUEEN': { minBattlesWon: 10, minPiecesKilled: 8, minEvolutionPoints: 50 },
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
        console.log(`🎯 PHASE 7: getAvailableEvolutionPaths called for piece ${pieceId}, type: ${piece.type}`);
        
        // ✅ PHASE 7: Use piece's own evolution points instead of player bank
        const piecePoints = piece.evolutionPoints || require('../server/pieceTypes').PIECE_TYPES[piece.type].points;
        console.log(`🎯 PHASE 7: Piece ${piece.type} has ${piecePoints} evolution points`);
        
        const paths = this.evolutionPaths[piece.type] || [];
        console.log(`🎯 PHASE 7: Evolution paths for ${piece.type}:`, paths.length, paths.map(p => p.targetType));
        
        // ✅ PHASE 7: Point-based system - piece needs enough evolution points
        return paths.map(path => {
            const canAfford = piecePoints >= path.cost;
            
            return {
                ...path,
                canAfford: canAfford,
                meetsRequirements: canAfford, // Only requirement is having enough points
                // Include failure reasons for UI display
                failureReasons: [
                    !canAfford && `Need ${path.cost - piecePoints} more points`
                ].filter(Boolean)
            };
        });
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