// Shark OS Snapshot Manager
// Sistema para guardar y restaurar estado del sistema

import { kernelLog } from './KernelLogger';
import { systemEvents } from './EventBus';

export interface Snapshot {
  id: string;
  name: string;
  createdAt: Date;
  data: SnapshotData;
}

export interface SnapshotData {
  version: string;
  timestamp: number;
  windows: Array<{
    appId: string;
    title: string;
    x: string | number;
    y: string | number;
    width: number;
    height: number;
    isMaximized: boolean;
    args?: unknown;
  }>;
  processes: Array<{
    name: string;
    pid: number;
  }>;
  settings: Record<string, unknown>;
  wallpaper: string;
  brightness: number;
}

class SnapshotManager {
  private snapshots: Map<string, Snapshot> = new Map();
  private maxSnapshots = 10;
  private storageKey = 'shark-snapshots';

  constructor() {
    this.loadSnapshots();
  }

  private async loadSnapshots(): Promise<void> {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const data = JSON.parse(saved);
          data.forEach((s: Snapshot) => {
            s.createdAt = new Date(s.createdAt);
            this.snapshots.set(s.id, s);
          });
        }
      }
    } catch (e) {
      kernelLog.error('system', 'Failed to load snapshots');
    }
  }

  private async saveSnapshots(): Promise<void> {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = Array.from(this.snapshots.values());
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (e) {
      kernelLog.error('system', 'Failed to save snapshots');
    }
  }

  // Create a new snapshot
  async create(name: string, data: SnapshotData): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
      data
    };

    this.snapshots.set(snapshot.id, snapshot);
    
    // Trim old snapshots
    if (this.snapshots.size > this.maxSnapshots) {
      const oldest = Array.from(this.snapshots.values())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (oldest) {
        this.snapshots.delete(oldest.id);
      }
    }

    await this.saveSnapshots();
    
    kernelLog.info('system', `Snapshot created: ${name}`, { id: snapshot.id });
    systemEvents.emit('system.snapshot', { action: 'create', name, id: snapshot.id }, 'SnapshotManager');

    return snapshot;
  }

  // Get all snapshots
  list(): Snapshot[] {
    return Array.from(this.snapshots.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get a specific snapshot
  get(id: string): Snapshot | undefined {
    return this.snapshots.get(id);
  }

  // Delete a snapshot
  async delete(id: string): Promise<boolean> {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) return false;

    this.snapshots.delete(id);
    await this.saveSnapshots();
    
    kernelLog.info('system', `Snapshot deleted: ${snapshot.name}`);
    systemEvents.emit('system.snapshot', { action: 'delete', name: snapshot.name, id }, 'SnapshotManager');

    return true;
  }

  // Restore from snapshot
  async restore(id: string): Promise<SnapshotData | null> {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) return null;

    kernelLog.info('system', `Restoring snapshot: ${snapshot.name}`, { id });
    systemEvents.emit('system.snapshot', { action: 'restore', name: snapshot.name, id }, 'SnapshotManager');

    return snapshot.data;
  }

  // Get formatted list for terminal
  getFormattedList(): string {
    const snapshots = this.list();
    
    if (snapshots.length === 0) {
      return 'No snapshots available.\n\nCreate one with: shark snapshot create <name>';
    }

    let output = 'System Snapshots:\n\n';
    output += 'ID                                    NAME                 CREATED\n';
    output += '───────────────────────────────────── ──────────────────── ────────────────────\n';
    
    snapshots.forEach(s => {
      const id = s.id.slice(0, 36);
      const name = s.name.padEnd(20);
      const date = s.createdAt.toLocaleString().padEnd(19);
      output += `${id} ${name} ${date}\n`;
    });

    return output;
  }

  // Quick snapshot (auto-named)
  async quickSnapshot(data: SnapshotData): Promise<Snapshot> {
    const name = `Auto-save ${new Date().toLocaleString()}`;
    return this.create(name, data);
  }
}

export const snapshotManager = new SnapshotManager();
