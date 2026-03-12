export interface GameMessage {
  type: string;
  payload: any;
}

export type MessageHandler = (message: GameMessage) => void;

export class MultiplayerWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isIntentionalClose = false;
  
  constructor(url: string) {
    this.url = url;
  }
  
  // الاتصال بالخادم
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('[Multiplayer] Connected to server');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: GameMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[Multiplayer] Error parsing message:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('[Multiplayer] WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('[Multiplayer] Disconnected from server');
          
          if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // إعادة الاتصال التلقائي
  private reconnect() {
    this.reconnectAttempts++;
    console.log(`[Multiplayer] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[Multiplayer] Reconnection failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }
  
  // إرسال رسالة
  send(message: GameMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Multiplayer] Cannot send message: WebSocket not connected');
    }
  }
  
  // معالجة الرسائل الواردة
  private handleMessage(message: GameMessage) {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('[Multiplayer] Error in message handler:', error);
      }
    });
  }
  
  // إضافة معالج رسائل
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    
    // إرجاع دالة لإزالة المعالج
    return () => {
      this.messageHandlers.delete(handler);
    };
  }
  
  // قطع الاتصال
  disconnect() {
    this.isIntentionalClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  // التحقق من حالة الاتصال
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  // إرسال ping للتحقق من الاتصال
  ping() {
    this.send({ type: 'PING', payload: {} });
  }
}
