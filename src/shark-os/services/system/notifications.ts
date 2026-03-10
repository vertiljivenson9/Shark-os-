import { Notification } from '../../types';

export class NotificationManager {
  private listeners: ((n: Notification) => void)[] = [];
  private history: Notification[] = [];

  constructor() {}

  push(title: string, message: string, urgent = false) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      title,
      message,
      timestamp: Date.now(),
      urgent
    };
    
    this.history.unshift(notification);
    if (this.history.length > 50) this.history.pop();
    
    this.listeners.forEach(cb => cb(notification));
  }

  subscribe(cb: (n: Notification) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  getHistory() {
    return this.history;
  }
}