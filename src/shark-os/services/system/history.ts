
import { Notification } from '../../types';

export interface HistoryEvent {
  id: string;
  type: 'kernel' | 'app' | 'fs' | 'dna';
  message: string;
  timestamp: number;
}

export class HistoryService {
  private events: HistoryEvent[] = [];
  private listeners: ((events: HistoryEvent[]) => void)[] = [];

  constructor() {
    this.record('kernel', 'Génesis del Sistema Shark OS Apex');
    this.record('dna', 'Inyección inicial de PROJECT_SOURCE por Compilador Humano');
    this.record('dna', 'PROTOCOLO GÉNESIS: Conexión exitosa con nodo vertiljivenson9/Predator.');
  }

  record(type: HistoryEvent['type'], message: string) {
    const event: HistoryEvent = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now()
    };
    this.events.unshift(event);
    if (this.events.length > 100) this.events.pop();
    this.notify();
  }

  subscribe(cb: (events: HistoryEvent[]) => void) {
    this.listeners.push(cb);
    cb(this.events);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.events));
  }

  getEvents() { return this.events; }
}
