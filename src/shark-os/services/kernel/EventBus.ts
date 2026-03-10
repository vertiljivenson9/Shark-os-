// Shark OS System Event Bus
// Sistema central de eventos para comunicación entre componentes

export type SystemEventType =
  // Process events
  | 'process.spawn'
  | 'process.exit'
  | 'process.kill'
  | 'process.crash'
  | 'process.pause'
  | 'process.resume'
  // Runtime events
  | 'runtime.install'
  | 'runtime.uninstall'
  | 'runtime.error'
  | 'runtime.ready'
  // File events
  | 'file.create'
  | 'file.delete'
  | 'file.write'
  | 'file.read'
  // System events
  | 'system.boot'
  | 'system.shutdown'
  | 'system.sleep'
  | 'system.wake'
  | 'system.error'
  | 'system.warning'
  | 'system.update'
  // Network events
  | 'network.connected'
  | 'network.disconnected'
  | 'network.request'
  | 'network.error'
  // App events
  | 'app.install'
  | 'app.uninstall'
  | 'app.launch'
  | 'app.close'
  // Security events
  | 'security.lock'
  | 'security.unlock'
  | 'security.permission'
  | 'security.alert'
  // Notification events
  | 'notification.show'
  | 'notification.dismiss'
  // AI events
  | 'ai.query'
  | 'ai.response'
  | 'ai.error';

export interface SystemEvent {
  id: string;
  type: SystemEventType;
  timestamp: Date;
  data: Record<string, unknown>;
  source?: string;
}

type EventCallback = (event: SystemEvent) => void;

class SystemEventBus {
  private listeners: Map<SystemEventType, Set<EventCallback>> = new Map();
  private eventHistory: SystemEvent[] = [];
  private maxHistory = 100;
  private wildcardListeners: Set<EventCallback> = new Set();

  // Subscribe to specific event type
  on(eventType: SystemEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // Subscribe to all events
  onAny(callback: EventCallback): () => void {
    this.wildcardListeners.add(callback);
    return () => {
      this.wildcardListeners.delete(callback);
    };
  }

  // One-time subscription
  once(eventType: SystemEventType, callback: EventCallback): void {
    const wrapper: EventCallback = (event) => {
      callback(event);
      this.listeners.get(eventType)?.delete(wrapper);
    };
    this.on(eventType, wrapper);
  }

  // Emit an event
  emit(type: SystemEventType, data: Record<string, unknown> = {}, source?: string): SystemEvent {
    const event: SystemEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      data,
      source
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Notify specific listeners
    this.listeners.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error(`[EventBus] Listener error for ${type}:`, e);
      }
    });

    // Notify wildcard listeners
    this.wildcardListeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error(`[EventBus] Wildcard listener error:`, e);
      }
    });

    return event;
  }

  // Emit with shorthand helpers
  processSpawn(pid: number, name: string): void {
    this.emit('process.spawn', { pid, name }, 'ProcessManager');
  }

  processExit(pid: number, name: string, code: number = 0): void {
    this.emit('process.exit', { pid, name, code }, 'ProcessManager');
  }

  processCrash(pid: number, name: string, error: string): void {
    this.emit('process.crash', { pid, name, error }, 'ProcessManager');
  }

  runtimeInstall(runtime: string, version: string): void {
    this.emit('runtime.install', { runtime, version }, 'RuntimeManager');
  }

  appLaunch(appId: string): void {
    this.emit('app.launch', { appId }, 'AppLauncher');
  }

  appClose(appId: string): void {
    this.emit('app.close', { appId }, 'AppLauncher');
  }

  systemError(message: string, details?: Record<string, unknown>): void {
    this.emit('system.error', { message, ...details }, 'System');
  }

  systemWarning(message: string): void {
    this.emit('system.warning', { message }, 'System');
  }

  notificationShow(title: string, message: string, type: string = 'info'): void {
    this.emit('notification.show', { title, message, type }, 'NotificationManager');
  }

  fileWrite(path: string, size: number): void {
    this.emit('file.write', { path, size }, 'VFS');
  }

  fileDelete(path: string): void {
    this.emit('file.delete', { path }, 'VFS');
  }

  // Get event history
  getHistory(filter?: { type?: SystemEventType; limit?: number }): SystemEvent[] {
    let result = [...this.eventHistory];
    
    if (filter?.type) {
      result = result.filter(e => e.type === filter.type);
    }
    
    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }
    
    return result;
  }

  // Get formatted history for terminal
  getFormattedHistory(filter?: { type?: SystemEventType; limit?: number }): string {
    const events = this.getHistory(filter);
    return events.map(e => {
      const time = e.timestamp.toLocaleTimeString();
      return `[${time}] ${e.type} ${JSON.stringify(e.data)}`;
    }).join('\n');
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Stats
  getStats(): { totalEvents: number; eventsByType: Record<string, number> } {
    const eventsByType: Record<string, number> = {};
    
    this.eventHistory.forEach(e => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
    });

    return { totalEvents: this.eventHistory.length, eventsByType };
  }
}

export const systemEvents = new SystemEventBus();
