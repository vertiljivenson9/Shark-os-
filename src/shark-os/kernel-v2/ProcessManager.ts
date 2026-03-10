// Shark OS Kernel v2.0 - Advanced Process Management
// Simula multitasking preemptive con prioridades reales

export enum ProcessPriority {
  REALTIME = 0,    // UI crítico
  HIGH = 1,        // Apps en foreground
  NORMAL = 2,      // Apps normales
  LOW = 3,         // Background tasks
  IDLE = 4         // Solo cuando no hay nada más
}

export enum ProcessState {
  CREATED = 'created',
  RUNNING = 'running',
  READY = 'ready',
  BLOCKED = 'blocked',
  SLEEPING = 'sleeping',
  ZOMBIE = 'zombie',
  TERMINATED = 'terminated'
}

export interface Process {
  pid: number;
  ppid: number;
  name: string;
  state: ProcessState;
  priority: ProcessPriority;
  startTime: number;
  cpuTime: number;
  memoryUsage: number;
  threads: number;
  openFiles: string[];
  environment: Record<string, string>;
  exitCode?: number;
  checkpoint?: any;
}

export interface ProcessEvent {
  type: 'spawn' | 'exit' | 'signal' | 'crash' | 'checkpoint';
  pid: number;
  data?: any;
}

type ProcessListener = (event: ProcessEvent) => void;

export class ProcessManager {
  private processTable = new Map<number, Process>();
  private readyQueues: Process[][] = [[], [], [], [], []];
  private currentProcess: Process | null = null;
  private nextPid = 1;
  private listeners: ProcessListener[] = [];
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private timeSlice = 100;
  private totalContextSwitches = 0;
  private totalCpuTime = 0;

  spawn(name: string, ppid: number = 0, priority: ProcessPriority = ProcessPriority.NORMAL): number {
    const process: Process = {
      pid: this.nextPid++,
      ppid,
      name,
      state: ProcessState.READY,
      priority,
      startTime: Date.now(),
      cpuTime: 0,
      memoryUsage: 0,
      threads: 1,
      openFiles: [],
      environment: { ...process.env, HOME: '/user/home' },
    };

    this.processTable.set(process.pid, process);
    this.readyQueues[priority].push(process);
    this.emit({ type: 'spawn', pid: process.pid, data: { name, priority } });

    return process.pid;
  }

  kill(pid: number, exitCode: number = 0): boolean {
    const process = this.processTable.get(pid);
    if (!process) return false;

    process.state = ProcessState.TERMINATED;
    process.exitCode = exitCode;
    
    // Mover hijos a init (pid 1) o marcar como zombies
    for (const [childPid, child] of this.processTable) {
      if (child.ppid === pid) {
        child.ppid = 1;
        if (child.state !== ProcessState.TERMINATED) {
          child.state = ProcessState.ZOMBIE;
        }
      }
    }

    // Remover de colas
    this.readyQueues.forEach(queue => {
      const idx = queue.findIndex(p => p.pid === pid);
      if (idx !== -1) queue.splice(idx, 1);
    });

    this.emit({ type: 'exit', pid, data: { exitCode } });
    
    // Limpiar después de un tiempo
    setTimeout(() => this.processTable.delete(pid), 5000);
    
    return true;
  }

  signal(pid: number, signal: number): boolean {
    const process = this.processTable.get(pid);
    if (!process) return false;

    switch (signal) {
      case 9: // SIGKILL
        return this.kill(pid, 137);
      case 19: // SIGSTOP
        process.state = ProcessState.SLEEPING;
        return true;
      case 18: // SIGCONT
        if (process.state === ProcessState.SLEEPING) {
          process.state = ProcessState.READY;
          this.readyQueues[process.priority].push(process);
        }
        return true;
    }
    this.emit({ type: 'signal', pid, data: { signal } });
    return true;
  }

  getProcess(pid: number): Process | undefined {
    return this.processTable.get(pid);
  }

  getAllProcesses(): Process[] {
    return Array.from(this.processTable.values());
  }

  getProcessTree(): Map<number, number[]> {
    const tree = new Map<number, number[]>();
    for (const [pid, proc] of this.processTable) {
      if (!tree.has(proc.ppid)) tree.set(proc.ppid, []);
      tree.get(proc.ppid)!.push(pid);
    }
    return tree;
  }

  // Checkpointing para recovery
  checkpoint(pid: number, state: any): boolean {
    const process = this.processTable.get(pid);
    if (!process) return false;
    process.checkpoint = { ...state, timestamp: Date.now() };
    this.emit({ type: 'checkpoint', pid, data: state });
    return true;
  }

  restore(pid: number): any | null {
    const process = this.processTable.get(pid);
    return process?.checkpoint || null;
  }

  start(): void {
    if (this.schedulerInterval) return;
    this.schedulerInterval = setInterval(() => this.schedule(), this.timeSlice);
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  private schedule(): void {
    // Guardar estado del proceso actual
    if (this.currentProcess) {
      this.currentProcess.cpuTime += this.timeSlice;
      this.totalCpuTime += this.timeSlice;
      
      if (this.currentProcess.state === ProcessState.RUNNING) {
        this.currentProcess.state = ProcessState.READY;
        this.readyQueues[this.currentProcess.priority].push(this.currentProcess);
      }
    }

    // Round-robin con prioridades
    for (let i = 0; i < this.readyQueues.length; i++) {
      const queue = this.readyQueues[i];
      if (queue.length > 0) {
        this.currentProcess = queue.shift()!;
        this.currentProcess.state = ProcessState.RUNNING;
        this.totalContextSwitches++;
        break;
      }
    }
  }

  getStats() {
    return {
      totalProcesses: this.processTable.size,
      runningProcesses: this.getAllProcesses().filter(p => p.state === ProcessState.RUNNING).length,
      contextSwitches: this.totalContextSwitches,
      totalCpuTime: this.totalCpuTime,
      uptime: Date.now() - (this.processTable.get(1)?.startTime || Date.now())
    };
  }

  on(listener: ProcessListener): void {
    this.listeners.push(listener);
  }

  off(listener: ProcessListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: ProcessEvent): void {
    this.listeners.forEach(l => l(event));
  }
}

export const processManager = new ProcessManager();
