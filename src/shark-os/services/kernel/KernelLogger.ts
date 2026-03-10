// Shark OS Kernel Logging System
// Sistema central de logs del kernel

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 'process' | 'memory' | 'network' | 'fs' | 'system' | 'runtime' | 'error' | 'security';

export interface KernelLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, unknown>;
  pid?: number;
}

class KernelLogger {
  private logs: KernelLogEntry[] = [];
  private maxLogs = 1000;
  private listeners: ((entry: KernelLogEntry) => void)[] = [];

  // Log principal
  log(level: LogLevel, category: LogCategory, message: string, details?: Record<string, unknown>, pid?: number): void {
    const entry: KernelLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      pid
    };

    this.logs.push(entry);
    
    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(l => l(entry));

    // Console output in dev
    const time = entry.timestamp.toLocaleTimeString();
    const prefix = this.getLevelPrefix(level);
    console.log(`[${time}] ${prefix} [${category}] ${message}`);
  }

  // Convenience methods
  debug(category: LogCategory, message: string, details?: Record<string, unknown>): void {
    this.log('debug', category, message, details);
  }

  info(category: LogCategory, message: string, details?: Record<string, unknown>, pid?: number): void {
    this.log('info', category, message, details, pid);
  }

  warn(category: LogCategory, message: string, details?: Record<string, unknown>): void {
    this.log('warn', category, message, details);
  }

  error(category: LogCategory, message: string, details?: Record<string, unknown>, pid?: number): void {
    this.log('error', category, message, details, pid);
  }

  critical(category: LogCategory, message: string, details?: Record<string, unknown>): void {
    this.log('critical', category, message, details);
  }

  // Process-specific helpers
  processSpawn(pid: number, name: string): void {
    this.info('process', `spawn pid=${pid} name=${name}`, { pid, name }, pid);
  }

  processExit(pid: number, name: string, code: number = 0): void {
    const level = code === 0 ? 'info' : 'warn';
    this.log(level, 'process', `exit pid=${pid} name=${name} code=${code}`, { pid, name, code }, pid);
  }

  processKill(pid: number, name: string, killer?: number): void {
    this.warn('process', `killed pid=${pid} name=${name}${killer ? ` by=${killer}` : ''}`, { pid, name, killer }, pid);
  }

  processCrash(pid: number, name: string, error: string): void {
    this.error('process', `crashed pid=${pid} name=${name} error="${error}"`, { pid, name, error }, pid);
  }

  // Get logs
  getLogs(filter?: { category?: LogCategory; level?: LogLevel; limit?: number }): KernelLogEntry[] {
    let result = [...this.logs];
    
    if (filter?.category) {
      result = result.filter(l => l.category === filter.category);
    }
    if (filter?.level) {
      result = result.filter(l => l.level === filter.level);
    }
    
    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }
    
    return result;
  }

  // Get formatted logs for terminal
  getFormattedLogs(filter?: { category?: LogCategory; level?: LogLevel; limit?: number }): string {
    const logs = this.getLogs(filter);
    return logs.map(l => {
      const time = l.timestamp.toLocaleTimeString();
      const prefix = this.getLevelPrefix(l.level);
      return `[${time}] ${prefix} ${l.message}`;
    }).join('\n');
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info('system', 'logs cleared');
  }

  // Subscribe to logs
  subscribe(callback: (entry: KernelLogEntry) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Stats
  getStats(): { total: number; byLevel: Record<LogLevel, number>; byCategory: Record<LogCategory, number> } {
    const byLevel: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0, critical: 0 };
    const byCategory: Record<LogCategory, number> = {
      process: 0, memory: 0, network: 0, fs: 0, system: 0, runtime: 0, error: 0, security: 0
    };

    this.logs.forEach(l => {
      byLevel[l.level]++;
      byCategory[l.category]++;
    });

    return { total: this.logs.length, byLevel, byCategory };
  }

  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case 'debug': return '\x1b[90m●\x1b[0m';
      case 'info': return '\x1b[34m●\x1b[0m';
      case 'warn': return '\x1b[33m●\x1b[0m';
      case 'error': return '\x1b[31m●\x1b[0m';
      case 'critical': return '\x1b[31;1m☠\x1b[0m';
    }
  }
}

export const kernelLog = new KernelLogger();
