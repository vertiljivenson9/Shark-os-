import { Process } from '../../types';

const isClient = typeof window !== 'undefined';

export class Scheduler {
  private processTable: Map<number, Process> = new Map();
  private queue: number[] = [];
  private currentPid: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  add(process: Process) {
    this.processTable.set(process.pid, process);
    this.queue.push(process.pid);
  }

  remove(pid: number) {
    this.processTable.delete(pid);
    this.queue = this.queue.filter(p => p !== pid);
    if (this.currentPid === pid) this.currentPid = null;
  }

  getAll(): Process[] { return Array.from(this.processTable.values()); }

  start() {
    if (this.intervalId || !isClient) return;
    this.intervalId = setInterval(() => {
      if (this.queue.length === 0) return;
      const nextPid = this.queue.shift();
      if (nextPid) {
        this.currentPid = nextPid;
        this.queue.push(nextPid);
      }
    }, 100);
  }

  stop() { if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; } }
}
