import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { roomManager, Player, Room } from './room-manager';

export interface GameMessage {
  type: string;
  payload: any;
}

export class MultiplayerWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  
  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/multiplayer' });
    this.setupWebSocketServer();
  }
  
  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[Multiplayer] New client connected');
      
      let playerId: string | null = null;
      
      ws.on('message', (data: Buffer) => {
        try {
          const message: GameMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message, (id) => { playerId = id; });
        } catch (error) {
          console.error('[Multiplayer] Error parsing message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });
      
      ws.on('close', () => {
        console.log('[Multiplayer] Client disconnected');
        if (playerId) {
          this.handlePlayerDisconnect(playerId);
          this.clients.delete(playerId);
        }
      });
      
      ws.on('error', (error: Error) => {
        console.error('[Multiplayer] WebSocket error:', error);
      });
    });
    
    console.log('[Multiplayer] WebSocket server initialized');
  }
  
  private handleMessage(
    ws: WebSocket,
    message: GameMessage,
    setPlayerId: (id: string) => void
  ) {
    const { type, payload } = message;
    
    switch (type) {
      case 'CREATE_ROOM':
        this.handleCreateRoom(ws, payload, setPlayerId);
        break;
        
      case 'JOIN_ROOM':
        this.handleJoinRoom(ws, payload, setPlayerId);
        break;
        
      case 'LEAVE_ROOM':
        this.handleLeaveRoom(payload.playerId);
        break;
        
      case 'SET_CARDS':
        this.handleSetCards(payload);
        break;
        
      case 'PLAYER_READY':
        this.handlePlayerReady(payload);
        break;
        
      case 'REVEAL_CARD':
        this.handleRevealCard(payload);
        break;
        
      case 'PING':
        this.send(ws, { type: 'PONG', payload: {} });
        break;
        
      default:
        console.warn('[Multiplayer] Unknown message type:', type);
    }
  }
  
  private handleCreateRoom(
    ws: WebSocket,
    payload: { playerId: string; playerName: string },
    setPlayerId: (id: string) => void
  ) {
    const { playerId, playerName } = payload;
    
    const player: Player = {
      id: playerId,
      name: playerName,
      socketId: playerId,
      isReady: false,
    };
    
    const room = roomManager.createRoom(player);
    this.clients.set(playerId, ws);
    setPlayerId(playerId);
    
    this.send(ws, {
      type: 'ROOM_CREATED',
      payload: {
        roomId: room.id,
        playerId,
      },
    });
    
    console.log(`[Multiplayer] Room created: ${room.id} by ${playerName}`);
  }
  
  private handleJoinRoom(
    ws: WebSocket,
    payload: { roomId: string; playerId: string; playerName: string },
    setPlayerId: (id: string) => void
  ) {
    const { roomId, playerId, playerName } = payload;
    
    const player: Player = {
      id: playerId,
      name: playerName,
      socketId: playerId,
      isReady: false,
    };
    
    const room = roomManager.joinRoom(roomId, player);
    
    if (!room) {
      this.sendError(ws, 'Room not found or full');
      return;
    }
    
    this.clients.set(playerId, ws);
    setPlayerId(playerId);
    
    // إرسال تأكيد للاعب الجديد
    this.send(ws, {
      type: 'ROOM_JOINED',
      payload: {
        roomId: room.id,
        player1: room.player1,
        player2: room.player2,
      },
    });
    
    // إخبار اللاعب الأول
    if (room.player1) {
      this.sendToPlayer(room.player1.id, {
        type: 'PLAYER_JOINED',
        payload: {
          roomId: room.id,
          player: room.player2,
        },
      });
    }
    
    console.log(`[Multiplayer] ${playerName} joined room: ${roomId}`);
  }
  
  private handleLeaveRoom(playerId: string) {
    const room = roomManager.leaveRoom(playerId);
    
    if (room) {
      // إخبار اللاعب الآخر
      const otherPlayer = room.player1 || room.player2;
      if (otherPlayer) {
        this.sendToPlayer(otherPlayer.id, {
          type: 'PLAYER_LEFT',
          payload: { playerId },
        });
      }
    }
    
    this.clients.delete(playerId);
    console.log(`[Multiplayer] Player ${playerId} left room`);
  }
  
  private handleSetCards(payload: {
    playerId: string;
    cards: any[];
    rounds: number;
  }) {
    const { playerId, cards, rounds } = payload;
    const room = roomManager.setPlayerCards(playerId, cards, rounds);
    
    if (!room) return;
    
    // إخبار اللاعب الآخر
    const otherPlayer = room.player1?.id === playerId ? room.player2 : room.player1;
    if (otherPlayer) {
      this.sendToPlayer(otherPlayer.id, {
        type: 'OPPONENT_CARDS_SET',
        payload: { rounds },
      });
    }
  }
  
  private handlePlayerReady(payload: { playerId: string; isReady: boolean }) {
    const { playerId, isReady } = payload;
    const room = roomManager.setPlayerReady(playerId, isReady);
    
    if (!room) return;
    
    // إخبار اللاعب الآخر
    const otherPlayer = room.player1?.id === playerId ? room.player2 : room.player1;
    if (otherPlayer) {
      this.sendToPlayer(otherPlayer.id, {
        type: 'OPPONENT_READY',
        payload: { isReady },
      });
    }
    
    // إذا كان كلا اللاعبين جاهزين، ابدأ المباراة
    if (roomManager.areBothPlayersReady(room.id)) {
      this.startBattle(room);
    }
  }
  
  private startBattle(room: Room) {
    if (!room.player1 || !room.player2) return;
    
    const battleData = {
      player1: {
        id: room.player1.id,
        name: room.player1.name,
        cards: room.player1.cards,
      },
      player2: {
        id: room.player2.id,
        name: room.player2.name,
        cards: room.player2.cards,
      },
    };
    
    // إرسال بيانات البداية لكلا اللاعبين
    this.sendToPlayer(room.player1.id, {
      type: 'BATTLE_START',
      payload: battleData,
    });
    
    this.sendToPlayer(room.player2.id, {
      type: 'BATTLE_START',
      payload: battleData,
    });
    
    console.log(`[Multiplayer] Battle started in room: ${room.id}`);
  }
  
  private handleRevealCard(payload: {
    playerId: string;
    roundIndex: number;
    card: any;
  }) {
    const { playerId, roundIndex, card } = payload;
    const room = roomManager.getPlayerRoom(playerId);
    
    if (!room) return;
    
    // إرسال البطاقة المكشوفة للاعب الآخر
    const otherPlayer = room.player1?.id === playerId ? room.player2 : room.player1;
    if (otherPlayer) {
      this.sendToPlayer(otherPlayer.id, {
        type: 'OPPONENT_CARD_REVEALED',
        payload: { roundIndex, card },
      });
    }
  }
  
  private handlePlayerDisconnect(playerId: string) {
    const room = roomManager.getPlayerRoom(playerId);
    
    if (room) {
      // إخبار اللاعب الآخر بالانقطاع
      const otherPlayer = room.player1?.id === playerId ? room.player2 : room.player1;
      if (otherPlayer) {
        this.sendToPlayer(otherPlayer.id, {
          type: 'OPPONENT_DISCONNECTED',
          payload: { playerId },
        });
      }
      
      // حذف الغرفة بعد 30 ثانية إذا لم يعد الاتصال
      setTimeout(() => {
        const currentRoom = roomManager.getRoom(room.id);
        if (currentRoom && currentRoom.status === 'playing') {
          roomManager.deleteRoom(room.id);
        }
      }, 30000);
    }
  }
  
  private send(ws: WebSocket, message: GameMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  private sendToPlayer(playerId: string, message: GameMessage) {
    const ws = this.clients.get(playerId);
    if (ws) {
      this.send(ws, message);
    }
  }
  
  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'ERROR',
      payload: { error },
    });
  }
  
  // إرسال رسالة لجميع اللاعبين في الغرفة
  private broadcastToRoom(roomId: string, message: GameMessage) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    
    if (room.player1) {
      this.sendToPlayer(room.player1.id, message);
    }
    if (room.player2) {
      this.sendToPlayer(room.player2.id, message);
    }
  }
}
