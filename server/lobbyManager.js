const { v4: uuidv4 } = require('uuid');

class LobbyManager {
    constructor() {
        this.lobbies = new Map();
        this.playerToLobby = new Map(); // Track which lobby each player is in
        this.lobbySettings = {
            maxPlayers: 8,
            minPlayers: 2,
            gameMode: 'standard',
            timeLimit: 7, // seconds per move
            evolutionMode: 'standard',
            tournamentMode: false
        };
    }

    // Create a new lobby
    createLobby(creatorId, creatorName, settings = {}) {
        const lobbyId = uuidv4();
        const lobby = {
            id: lobbyId,
            name: settings.name || `${creatorName}'s Lobby`,
            creator: creatorId,
            createdAt: new Date(),
            status: 'waiting', // waiting, starting, in_game, finished
            players: [{
                id: creatorId,
                name: creatorName,
                ready: false,
                isCreator: true,
                joinedAt: new Date()
            }],
            settings: {
                ...this.lobbySettings,
                ...settings
            },
            gameId: null,
            startedAt: null
        };

        this.lobbies.set(lobbyId, lobby);
        this.playerToLobby.set(creatorId, lobbyId);

        console.log(`Lobby created: ${lobbyId} by ${creatorName}`);
        return lobby;
    }

    // Join an existing lobby
    joinLobby(lobbyId, playerId, playerName) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            return { success: false, error: 'Lobby not found' };
        }

        if (lobby.status !== 'waiting') {
            return { success: false, error: 'Lobby is not accepting new players' };
        }

        if (lobby.players.length >= lobby.settings.maxPlayers) {
            return { success: false, error: 'Lobby is full' };
        }

        // Check if player is already in a lobby
        const currentLobby = this.playerToLobby.get(playerId);
        if (currentLobby) {
            this.leaveLobby(currentLobby, playerId);
        }

        // Add player to lobby
        lobby.players.push({
            id: playerId,
            name: playerName,
            ready: false,
            isCreator: false,
            joinedAt: new Date()
        });

        this.playerToLobby.set(playerId, lobbyId);

        console.log(`Player ${playerName} joined lobby ${lobbyId}`);
        return { success: true, lobby: lobby };
    }

    // Leave a lobby
    leaveLobby(lobbyId, playerId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            return { success: false, error: 'Lobby not found' };
        }

        const playerIndex = lobby.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return { success: false, error: 'Player not in lobby' };
        }

        const player = lobby.players[playerIndex];
        lobby.players.splice(playerIndex, 1);
        this.playerToLobby.delete(playerId);

        // If creator left, assign new creator or delete lobby
        if (player.isCreator) {
            if (lobby.players.length > 0) {
                lobby.players[0].isCreator = true;
                lobby.creator = lobby.players[0].id;
                console.log(`New creator assigned: ${lobby.players[0].name}`);
            } else {
                // Delete empty lobby
                this.lobbies.delete(lobbyId);
                console.log(`Lobby deleted: ${lobbyId}`);
                return { success: true, lobbyDeleted: true };
            }
        }

        console.log(`Player ${player.name} left lobby ${lobbyId}`);
        return { success: true, lobby: lobby };
    }

    // Toggle player ready status
    toggleReady(lobbyId, playerId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            return { success: false, error: 'Lobby not found' };
        }

        const player = lobby.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player not in lobby' };
        }

        player.ready = !player.ready;
        console.log(`Player ${player.name} ready status: ${player.ready}`);

        // Check if all players are ready and can start game
        const readyToStart = this.canStartGame(lobby);
        if (readyToStart) {
            lobby.status = 'starting';
            lobby.startedAt = new Date();
        }

        return { success: true, lobby: lobby, readyToStart: readyToStart };
    }

    // Update lobby settings (only creator can do this)
    updateLobbySettings(lobbyId, playerId, newSettings) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            return { success: false, error: 'Lobby not found' };
        }

        const player = lobby.players.find(p => p.id === playerId);
        if (!player || !player.isCreator) {
            return { success: false, error: 'Only the lobby creator can change settings' };
        }

        if (lobby.status !== 'waiting') {
            return { success: false, error: 'Cannot change settings after game has started' };
        }

        // Validate and update settings
        const validatedSettings = this.validateSettings(newSettings);
        lobby.settings = { ...lobby.settings, ...validatedSettings };

        // Reset ready status when settings change
        lobby.players.forEach(p => p.ready = false);

        console.log(`Lobby settings updated: ${lobbyId}`);
        return { success: true, lobby: lobby };
    }

    // Check if game can start
    canStartGame(lobby) {
        if (lobby.status !== 'waiting') return false;
        if (lobby.players.length < lobby.settings.minPlayers) return false;
        if (lobby.players.length > lobby.settings.maxPlayers) return false;
        
        // All players must be ready
        return lobby.players.every(p => p.ready);
    }

    // Start a game from lobby
    startGame(lobbyId, gameId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            return { success: false, error: 'Lobby not found' };
        }

        if (!this.canStartGame(lobby)) {
            return { success: false, error: 'Not all players are ready' };
        }

        lobby.status = 'in_game';
        lobby.gameId = gameId;
        lobby.startedAt = new Date();

        console.log(`Game started from lobby ${lobbyId} with game ID ${gameId}`);
        return { success: true, lobby: lobby };
    }

    // Get all available lobbies
    getAvailableLobbies() {
        return Array.from(this.lobbies.values())
            .filter(lobby => lobby.status === 'waiting')
            .map(lobby => ({
                id: lobby.id,
                name: lobby.name,
                creator: lobby.players.find(p => p.isCreator)?.name || 'Unknown',
                playerCount: lobby.players.length,
                maxPlayers: lobby.settings.maxPlayers,
                gameMode: lobby.settings.gameMode,
                createdAt: lobby.createdAt,
                settings: lobby.settings
            }));
    }

    // Get lobby by ID
    getLobby(lobbyId) {
        return this.lobbies.get(lobbyId);
    }

    // Get player's current lobby
    getPlayerLobby(playerId) {
        const lobbyId = this.playerToLobby.get(playerId);
        return lobbyId ? this.lobbies.get(lobbyId) : null;
    }

    // Handle player disconnect
    handleDisconnect(playerId) {
        const lobbyId = this.playerToLobby.get(playerId);
        if (lobbyId) {
            this.leaveLobby(lobbyId, playerId);
            return lobbyId;
        }
        return null;
    }

    // Validate lobby settings
    validateSettings(settings) {
        const validated = {};
        
        if (settings.maxPlayers !== undefined) {
            validated.maxPlayers = Math.max(2, Math.min(8, parseInt(settings.maxPlayers)));
        }
        
        if (settings.minPlayers !== undefined) {
            validated.minPlayers = Math.max(2, Math.min(8, parseInt(settings.minPlayers)));
        }
        
        if (settings.gameMode !== undefined) {
            const validModes = ['standard', 'blitz', 'custom'];
            validated.gameMode = validModes.includes(settings.gameMode) ? settings.gameMode : 'standard';
        }
        
        if (settings.timeLimit !== undefined) {
            validated.timeLimit = Math.max(1, Math.min(30, parseInt(settings.timeLimit)));
        }
        
        if (settings.evolutionMode !== undefined) {
            const validEvolutionModes = ['standard', 'fast', 'slow'];
            validated.evolutionMode = validEvolutionModes.includes(settings.evolutionMode) ? settings.evolutionMode : 'standard';
        }
        
        if (settings.tournamentMode !== undefined) {
            validated.tournamentMode = Boolean(settings.tournamentMode);
        }
        
        return validated;
    }

    // Get lobby statistics
    getLobbyStats() {
        const lobbies = Array.from(this.lobbies.values());
        return {
            totalLobbies: lobbies.length,
            waitingLobbies: lobbies.filter(l => l.status === 'waiting').length,
            activeGames: lobbies.filter(l => l.status === 'in_game').length,
            totalPlayers: lobbies.reduce((sum, l) => sum + l.players.length, 0)
        };
    }

    // Clean up finished lobbies
    cleanupFinishedLobbies() {
        const now = new Date();
        const cutoff = 60 * 60 * 1000; // 1 hour

        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            if (lobby.status === 'finished' && (now - lobby.startedAt) > cutoff) {
                // Remove all players from tracking
                lobby.players.forEach(p => this.playerToLobby.delete(p.id));
                this.lobbies.delete(lobbyId);
                console.log(`Cleaned up finished lobby: ${lobbyId}`);
            }
        }
    }
}

module.exports = LobbyManager; 