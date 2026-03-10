// Shark OS IPC Bus v2.0 - Inter-Process Communication
// Sistema de mensajería entre apps y componentes

type ChannelHandler = (message: any) => void;

interface Subscription {
  id: string;
  handler: ChannelHandler;
  once: boolean;
}

export interface IPCMessage {
  id: string;
  channel: string;
  type: 'request' | 'response' | 'broadcast' | 'event';
  from: string;
  to?: string;
  payload: any;
  timestamp: number;
}

export class IPCBus {
  private channels = new Map<string, Set<Subscription>>();
  private messageQueue: IPCMessage[] = [];
  private messageId = 0;
  private handlers = new Map<string, ChannelHandler>();

  // Registrar handler en un canal
  register(channel: string, handler: ChannelHandler): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    const sub: Subscription = {
      id: crypto.randomUUID(),
      handler,
      once: false
    };
    this.channels.get(channel)!.add(sub);

    return () => {
      const subs = this.channels.get(channel);
      if (subs) {
        for (const s of subs) {
          if (s.handler === handler) {
            subs.delete(s);
            break;
          }
        }
      }
    };
  }

  // Una sola vez
  once(channel: string, handler: ChannelHandler): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    const sub: Subscription = {
      id: crypto.randomUUID(),
      handler,
      once: true
    };
    this.channels.get(channel)!.add(sub);
  }

  // Enviar mensaje
  send(channel: string, type: IPCMessage['type'], payload: any, from?: string, to?: string): string {
    const message: IPCMessage = {
      id: crypto.randomUUID(),
      channel,
      type,
      from: from || 'system',
      to,
      payload,
      timestamp: Date.now()
    };

    this.dispatchEvent(message);
    return message.id;
  }

  // Broadcast a todos
  broadcast(channel: string, payload: any, from?: string): void {
    this.send(channel, 'broadcast', payload, from);
  }

  private dispatchEvent(message: IPCMessage): void {
    const subs = this.channels.get(message.channel);
    if (!subs) return;

    subs.forEach(sub => {
      try {
        sub.handler(message);
        if (sub.once) {
          subs.delete(sub);
        }
      } catch (e) {
        console.error(`[IPC] Handler error:`, e);
      }
    });
  }

  // Request-Response pattern
  async request<T>(channel: string, payload: any, timeout = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      
      const timeoutId = setTimeout(() => {
        this.off(channel, handler);
        reject(new Error('IPC timeout'));
      }, timeout);

      const handler = (msg: IPCMessage) => {
        if (msg.id === requestId) {
          clearTimeout(timeoutId);
          this.off(channel, handler);
          resolve(msg.payload);
        }
      };

      this.register(channel, handler);
      this.send(channel, 'request', payload, 'requester', 'responder');
    });
  }

  // Remover handler
  off(channel: string, handler: ChannelHandler): void {
    const subs = this.channels.get(channel);
    if (subs) {
      for (const s of subs) {
        if (s.handler === handler) {
          subs.delete(s);
          break;
        }
      }
    }
  }

  // Obtener todos los mensajes pendientes
  getPendingMessages(): IPCMessage[] {
    return [...this.messageQueue];
  }

  // Limpiar cola
  clearQueue(): void {
    this.messageQueue = [];
  }
}

export const ipcBus = new IPCBus();
