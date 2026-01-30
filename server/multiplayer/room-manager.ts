import { randomBytes } from 'crypto';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  isReady: boolean;
  cards?: any[];
  rounds?: number;
}

export interface Room {
  id: string;
  player1: Player | null;
  player2: Player | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  expiresAt: Date;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  
  // توليد معرف غرفة فريد (6 أحرف)
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId = '';
    
    do {
      roomId = '';
      for (let i = 0; i < 6; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(roomId));
    
    return roomId;
  }
  
  // إنشاء غرفة جديدة
  createRoom(player: Player): Room {
    const roomId = this.generateRoomId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // تنتهي بعد 10 دقائق
    
    const room: Room = {
      id: roomId,
      player1: player,
      player2: null,
      status: 'waiting',
      createdAt: now,
      expiresAt,
    };
    
    this.rooms.set(roomId, room);
    this.playerToRoom.set(player.id, roomId);
    
    return room;
  }
  
  // الانضمام لغرفة موجودة
  joinRoom(roomId: string, player: Player): Room | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }
    
    if (room.status !== 'waiting') {
      return null;
    }
    
    if (room.player2) {
      return null; // الغرفة ممتلئة
    }
    
    room.player2 = player;
    room.status = 'playing';
    this.playerToRoom.set(player.id, roomId);
    
    return room;
  }
  
  // الحصول على غرفة
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }
  
  // الحصول على غرفة اللاعب
  getPlayerRoom(playerId: string): Room | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }
  
  // تحديث حالة اللاعب (جاهز)
  setPlayerReady(playerId: string, isReady: boolean): Room | null {
    const room = this.getPlayerRoom(playerId);
    if (!room) return null;
    
    if (room.player1?.id === playerId) {
      room.player1.isReady = isReady;
    } else if (room.player2?.id === playerId) {
      room.player2.isReady = isReady;
    }
    
    return room;
  }
  
  // تحديث بطاقات اللاعب
  setPlayerCards(playerId: string, cards: any[], rounds: number): Room | null {
    const room = this.getPlayerRoom(playerId);
    if (!room) return null;
    
    if (room.player1?.id === playerId) {
      room.player1.cards = cards;
      room.player1.rounds = rounds;
    } else if (room.player2?.id === playerId) {
      room.player2.cards = cards;
      room.player2.rounds = rounds;
    }
    
    return room;
  }
  
  // التحقق إذا كان كلا اللاعبين جاهزين
  areBothPlayersReady(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.player1 || !room.player2) return false;
    
    return room.player1.isReady && room.player2.isReady;
  }
  
  // مغادرة اللاعب للغرفة
  leaveRoom(playerId: string): Room | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;
    
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // إزالة اللاعب من الغرفة
    if (room.player1?.id === playerId) {
      room.player1 = null;
    } else if (room.player2?.id === playerId) {
      room.player2 = null;
    }
    
    this.playerToRoom.delete(playerId);
    
    // إذا لم يتبق أي لاعب، احذف الغرفة
    if (!room.player1 && !room.player2) {
      this.rooms.delete(roomId);
      return null;
    }
    
    // إذا تبقى لاعب واحد، أعد الغرفة لحالة الانتظار
    if (room.status === 'playing') {
      room.status = 'waiting';
    }
    
    return room;
  }
  
  // إنهاء الغرفة
  finishRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'finished';
    }
  }
  
  // حذف الغرفة
  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.player1) {
        this.playerToRoom.delete(room.player1.id);
      }
      if (room.player2) {
        this.playerToRoom.delete(room.player2.id);
      }
      this.rooms.delete(roomId);
    }
  }
  
  // تنظيف الغرف المنتهية
  cleanupExpiredRooms(): void {
    const now = new Date();
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (now > room.expiresAt || room.status === 'finished') {
        this.deleteRoom(roomId);
      }
    }
  }
  
  // الحصول على عدد الغرف النشطة
  getActiveRoomsCount(): number {
    return this.rooms.size;
  }
  
  // الحصول على جميع الغرف (للإدارة)
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

// مثيل واحد مشترك
export const roomManager = new RoomManager();

// تنظيف دوري كل 5 دقائق
setInterval(() => {
  roomManager.cleanupExpiredRooms();
}, 5 * 60 * 1000);
