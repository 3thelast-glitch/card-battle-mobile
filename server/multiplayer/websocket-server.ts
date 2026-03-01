import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { roomManager, Player, Room, RoundResult } from './room-manager';

export interface GameMessage {
  type: string;
  payload: any;
}

export class MultiplayerWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  // Grace-period reconnect tracking: playerId → timeout handle
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/multiplayer' });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      let playerId: string | null = null;

      ws.on('message', (data: Buffer) => {
        try {
          const message: GameMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message, (id) => { playerId = id; });
        } catch (error) {
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        if (playerId) {
          this.handlePlayerDisconnect(playerId);
          this.clients.delete(playerId);
        }
      });

      ws.on('error', (error: Error) => {
        console.error('[Multiplayer] WS error:', error.message);
      });

      // Ping every 25s to detect stale connections
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 25000);
    });

    console.log('[Multiplayer] WebSocket server ready on /multiplayer');
  }

  // ─── Message Router ─────────────────────────────────────────────────────────

  private handleMessage(ws: WebSocket, message: GameMessage, setPlayerId: (id: string) => void) {
    const { type, payload } = message;
    switch (type) {
      case 'CREATE_ROOM': this.handleCreateRoom(ws, payload, setPlayerId); break;
      case 'JOIN_ROOM': this.handleJoinRoom(ws, payload, setPlayerId); break;
      case 'RECONNECT': this.handleReconnect(ws, payload, setPlayerId); break;
      case 'LEAVE_ROOM': this.handleLeaveRoom(payload.playerId); break;
      case 'SET_CARDS': this.handleSetCards(payload); break;
      case 'PLAYER_READY': this.handlePlayerReady(payload); break;
      case 'REVEAL_CARD': this.handleRevealCard(payload); break;
      case 'PING': this.send(ws, { type: 'PONG', payload: { ts: Date.now() } }); break;
      default:
        console.warn('[Multiplayer] Unknown message type:', type);
    }
  }

  // ─── Create Room ────────────────────────────────────────────────────────────

  private handleCreateRoom(
    ws: WebSocket,
    payload: { playerId: string; playerName: string },
    setPlayerId: (id: string) => void
  ) {
    const { playerId, playerName } = payload;
    const player: Player = { id: playerId, name: playerName, socketId: playerId, isReady: false };
    const room = roomManager.createRoom(player);
    this.clients.set(playerId, ws);
    setPlayerId(playerId);
    this.send(ws, { type: 'ROOM_CREATED', payload: { roomId: room.id, playerId } });
    console.log(`[Multiplayer] Room created: ${room.id} by ${playerName}`);
  }

  // ─── Join Room ──────────────────────────────────────────────────────────────

  private handleJoinRoom(
    ws: WebSocket,
    payload: { roomId: string; playerId: string; playerName: string },
    setPlayerId: (id: string) => void
  ) {
    const { roomId, playerId, playerName } = payload;
    const player: Player = { id: playerId, name: playerName, socketId: playerId, isReady: false };
    const room = roomManager.joinRoom(roomId, player);
    if (!room) {
      this.sendError(ws, 'Room not found or full');
      return;
    }
    this.clients.set(playerId, ws);
    setPlayerId(playerId);

    this.send(ws, {
      type: 'ROOM_JOINED',
      payload: { roomId: room.id, player1: room.player1, player2: room.player2 },
    });

    if (room.player1) {
      this.sendToPlayer(room.player1.id, {
        type: 'PLAYER_JOINED',
        payload: { roomId: room.id, player: room.player2 },
      });
    }
    console.log(`[Multiplayer] ${playerName} joined room: ${roomId}`);
  }

  // ─── Reconnect ──────────────────────────────────────────────────────────────

  private handleReconnect(
    ws: WebSocket,
    payload: { playerId: string; roomId: string },
    setPlayerId: (id: string) => void
  ) {
    const { playerId, roomId } = payload;
    const room = roomManager.getRoom(roomId);
    if (!room) {
      this.sendError(ws, 'Room expired or not found');
      return;
    }
    // Cancel grace timer if pending
    const timer = this.reconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(playerId);
    }
    this.clients.set(playerId, ws);
    setPlayerId(playerId);

    const otherPlayer = room.player1?.id === playerId ? room.player2 : room.player1;
    this.send(ws, {
      type: 'RECONNECTED',
      payload: {
        room: {
          id: room.id,
          p1Score: room.p1Score,
          p2Score: room.p2Score,
          currentRoundIndex: room.roundHistory.length,
          totalRounds: room.totalRounds,
          status: room.status,
        },
        opponent: otherPlayer,
      },
    });

    if (otherPlayer) {
      this.sendToPlayer(otherPlayer.id, {
        type: 'OPPONENT_RECONNECTED',
        payload: { playerId },
      });
    }
  }

  // ─── Leave Room ─────────────────────────────────────────────────────────────

  private handleLeaveRoom(playerId: string) {
    const room = roomManager.leaveRoom(playerId);
    if (room) {
      const other = room.player1 || room.player2;
      if (other) {
        this.sendToPlayer(other.id, { type: 'PLAYER_LEFT', payload: { playerId } });
      }
    }
    this.clients.delete(playerId);
  }

  // ─── Set Cards ──────────────────────────────────────────────────────────────

  private handleSetCards(payload: { playerId: string; cards: any[]; rounds: number }) {
    const { playerId, cards, rounds } = payload;
    const room = roomManager.setPlayerCards(playerId, cards, rounds);
    if (!room) return;
    const other = room.player1?.id === playerId ? room.player2 : room.player1;
    if (other) {
      this.sendToPlayer(other.id, {
        type: 'OPPONENT_CARDS_SET',
        payload: { rounds },
      });
    }
  }

  // ─── Player Ready ────────────────────────────────────────────────────────────

  private handlePlayerReady(payload: { playerId: string; isReady: boolean }) {
    const { playerId, isReady } = payload;
    const room = roomManager.setPlayerReady(playerId, isReady);
    if (!room) return;
    const other = room.player1?.id === playerId ? room.player2 : room.player1;
    if (other) {
      this.sendToPlayer(other.id, { type: 'OPPONENT_READY', payload: { isReady } });
    }
    if (roomManager.areBothPlayersReady(room.id)) {
      this.startBattle(room);
    }
  }

  private startBattle(room: Room) {
    if (!room.player1 || !room.player2) return;
    const payload = {
      player1: { id: room.player1.id, name: room.player1.name, cards: room.player1.cards },
      player2: { id: room.player2.id, name: room.player2.name, cards: room.player2.cards },
      totalRounds: room.totalRounds || (room.player1.rounds ?? 5),
      p1Score: room.p1Score,
      p2Score: room.p2Score,
    };
    this.broadcastToRoom(room.id, { type: 'BATTLE_START', payload });
    console.log(`[Multiplayer] Battle started in room ${room.id}`);
  }

  // ─── Reveal Card  ────────────────────────────────────────────────────────────

  private handleRevealCard(payload: { playerId: string; roundIndex: number; card: any }) {
    const { playerId, roundIndex, card } = payload;
    const room = roomManager.getPlayerRoom(playerId);
    if (!room) return;

    // Notify opponent that player revealed (face-down reveal animation trigger)
    const other = room.player1?.id === playerId ? room.player2 : room.player1;
    if (other) {
      this.sendToPlayer(other.id, {
        type: 'OPPONENT_CARD_REVEALED',
        payload: { roundIndex },
      });
    }

    // Resolve if both revealed
    const result = roomManager.revealCard(playerId, roundIndex, card);
    if (result) {
      this.broadcastToRoom(room.id, { type: 'ROUND_RESULT', payload: result });

      if (roomManager.isGameOver(room)) {
        const gameOverPayload = {
          winner: result.p1Score > result.p2Score
            ? 'player1'
            : result.p2Score > result.p1Score
              ? 'player2'
              : 'draw',
          p1Score: result.p1Score,
          p2Score: result.p2Score,
          roundHistory: room.roundHistory,
        };
        this.broadcastToRoom(room.id, { type: 'GAME_OVER', payload: gameOverPayload });
        roomManager.finishRoom(room.id);
        setTimeout(() => roomManager.deleteRoom(room.id), 60000);
        console.log(`[Multiplayer] Game over in room ${room.id}: ${gameOverPayload.winner}`);
      }
    }
  }

  // ─── Disconnect ──────────────────────────────────────────────────────────────

  private handlePlayerDisconnect(playerId: string) {
    const room = roomManager.getPlayerRoom(playerId);
    if (!room) return;

    const other = room.player1?.id === playerId ? room.player2 : room.player1;
    if (other) {
      this.sendToPlayer(other.id, {
        type: 'OPPONENT_DISCONNECTED',
        payload: { playerId, grace: 30 },
      });
    }

    // Grace period: delete room if player doesn't reconnect in 30s
    const timer = setTimeout(() => {
      const currentRoom = roomManager.getRoom(room.id);
      if (currentRoom && !this.clients.has(playerId)) {
        if (other) {
          this.sendToPlayer(other.id, {
            type: 'OPPONENT_LEFT_PERMANENTLY',
            payload: { playerId },
          });
        }
        roomManager.deleteRoom(room.id);
      }
      this.reconnectTimers.delete(playerId);
    }, 30000);

    this.reconnectTimers.set(playerId, timer);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private send(ws: WebSocket, message: GameMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendToPlayer(playerId: string, message: GameMessage) {
    const ws = this.clients.get(playerId);
    if (ws) this.send(ws, message);
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, { type: 'ERROR', payload: { error } });
  }

  private broadcastToRoom(roomId: string, message: GameMessage) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    if (room.player1) this.sendToPlayer(room.player1.id, message);
    if (room.player2) this.sendToPlayer(room.player2.id, message);
  }
}
