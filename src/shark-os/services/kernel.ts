// Shark OS Kernel v15.13 - Core System
import { VFS } from './vfs';
import { PersistentRegistry } from './registry/prefs';
import { IDBBackend, MemoryBackend } from './vfs/backends';
import { Scheduler } from './kernel/scheduler';
import { NetworkStack } from './net/stack';
import { HistoryService } from './system/history';
import { NotificationManager } from './system/notifications';
import { PackageManager } from './pkg/manager';
import { VoiceControl } from './input/voice';
import { AudioMixer } from './media/audio';
import { AppDefinition, ProcessInfo } from '../types';
import { kernelLog } from './kernel/KernelLogger';
import { systemEvents } from './kernel/EventBus';
import { runtimeManager } from './kernel/RuntimeManager';
import { snapshotManager } from './kernel/SnapshotManager';
import { aiService } from './kernel/AIService';

export interface KernelStats {
  uptime: number;
  processCount: number;
  memoryUsage: number;
  cpuTime: number;
  contextSwitches: number;
}

class Kernel {
  public fs = new VFS();
  public registry = new PersistentRegistry();
  public scheduler = new Scheduler();
  public net = new NetworkStack();
  public history = new HistoryService();
  public notifications = new NotificationManager();
  public pkg = new PackageManager();
  public voice = new VoiceControl();
  public audio = new AudioMixer();
  public runtime = runtimeManager;
  public snapshots = snapshotManager;
  public ai = aiService;
  public log = kernelLog;
  public events = systemEvents;
  
  public bootTime = Date.now();
  private _booted = false;
  private safeMode = false;
  private processes: Map<number, ProcessInfo> = new Map();
  private nextPid = 1;
  private cpuTime = 0;
  private contextSwitches = 0;

  async boot() {
    if (this._booted) return;
    
    try {
      kernelLog.info('system', 'Shark OS boot sequence initiated');
      systemEvents.emit('system.boot', { timestamp: Date.now() }, 'Kernel');

      const sys = new IDBBackend('WebOS_System', 'sys');
      const usr = new IDBBackend('WebOS_User', 'usr');
      await sys.mount(); 
      await usr.mount();

      this.fs.mount('/tmp', new MemoryBackend());
      this.fs.mount('/user', usr);
      this.fs.mount('/', sys);

      await this.net.init();
      await this.pkg.init();
      await this.audio.init();

      // Create system directories
      const dirs = [
        '/system', '/system/apps', '/system/logs', '/system/runtimes',
        '/user/home', '/user/home/photos', '/user/home/documents',
        '/user/home/apps', '/user/secure', '/tmp'
      ];
      
      for (const d of dirs) {
        if (!(await this.fs.exists(d))) await this.fs.mkdir(d);
      }

      // Register core apps
      const apps: AppDefinition[] = [
        { id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'TerminalApp', version: '4.2' },
        { id: 'files', name: 'Explorer', icon: 'Folder', component: 'FilesApp', version: '4.1' },
        { id: 'editor', name: 'Notepad', icon: 'FileText', component: 'EditorApp', version: '2.0' },
        { id: 'settings', name: 'Settings', icon: 'Settings', component: 'SettingsApp', version: '4.5' },
        { id: 'store', name: 'App Store', icon: 'ShoppingCart', component: 'StoreApp', version: '1.5' },
        { id: 'camera', name: 'Camera', icon: 'Camera', component: 'CameraApp', version: '3.0' },
        { id: 'gallery', name: 'Gallery', icon: 'Image', component: 'GalleryApp', version: '3.0' },
        { id: 'calculator', name: 'Calculator', icon: 'Calculator', component: 'CalculatorApp', version: '2.0' },
        { id: 'ide', name: 'Studio', icon: 'Code', component: 'IDEApp', version: '5.1' },
        { id: 'developer', name: 'DevTools', icon: 'Cpu', component: 'DeveloperApp', version: '1.0' },
        { id: 'git_sync', name: 'Replicator', icon: 'Zap', component: 'GitSyncApp', version: '15.13' },
        { id: 'nexus_flux', name: 'Nexus Flux', icon: 'Zap', component: 'NexusFluxApp', version: '1.0' },
        { id: 'music', name: 'Music', icon: 'Music', component: 'MusicApp', version: '2.0' },
        { id: 'video', name: 'Videos', icon: 'Film', component: 'VideoPlayerApp', version: '2.0' },
        { id: 'paint', name: 'Paint', icon: 'Palette', component: 'PaintApp', version: '2.0' },
        { id: 'news', name: 'News', icon: 'Newspaper', component: 'NewsApp', version: '1.1' },
        { id: 'weather', name: 'Weather', icon: 'Sun', component: 'WeatherApp', version: '1.0' },
        { id: 'timeline', name: 'Timeline', icon: 'History', component: 'TimelineApp', version: '1.0' },
        { id: 'sys_mon', name: 'Monitor', icon: 'Activity', component: 'SystemMonitorApp', version: '2.0' },
        { id: 'zip_export', name: 'Backup', icon: 'Archive', component: 'ZipExportApp', version: '1.0' },
        { id: 'clock', name: 'Clock', icon: 'Clock', component: 'ClockApp', version: '1.0' }
      ];

      for (const app of apps) {
        await this.fs.write(`/system/apps/${app.id}.json`, JSON.stringify(app));
      }
      
      await this.registry.set('apps.installed', apps.map(a => a.id));

      this.scheduler.start();
      this._booted = true;
      
      kernelLog.info('system', 'Shark OS v15.13 boot complete', { 
        apps: apps.length,
        uptime: Date.now() - this.bootTime 
      });
      
      this.history.record('kernel', 'Sistema Shark OS v15.13 Online');

    } catch (e) {
      kernelLog.critical('system', `Boot failed: ${e}`);
      console.error('CRITICAL BOOT ERROR', e);
    }
  }

  // Process Management
  spawnProcess(name: string, priority: number = 1): number {
    const pid = this.nextPid++;
    const process: ProcessInfo = {
      pid,
      name,
      status: 'running',
      startTime: Date.now(),
      priority,
      cpuTime: 0,
      memory: Math.floor(Math.random() * 50 + 10) * 1024 * 1024 // Simulated
    };
    
    this.processes.set(pid, process);
    this.scheduler.add(process);
    
    kernelLog.processSpawn(pid, name);
    systemEvents.processSpawn(pid, name);
    
    return pid;
  }

  killProcess(pid: number): boolean {
    const process = this.processes.get(pid);
    if (!process) return false;
    
    this.processes.delete(pid);
    this.scheduler.remove(pid);
    
    kernelLog.processExit(pid, process.name);
    systemEvents.processExit(pid, process.name);
    
    return true;
  }

  pauseProcess(pid: number): boolean {
    const process = this.processes.get(pid);
    if (!process) return false;
    
    process.status = 'sleeping';
    kernelLog.info('process', `paused pid=${pid} name=${process.name}`);
    systemEvents.emit('process.pause', { pid, name: process.name }, 'Kernel');
    
    return true;
  }

  resumeProcess(pid: number): boolean {
    const process = this.processes.get(pid);
    if (!process) return false;
    
    process.status = 'running';
    kernelLog.info('process', `resumed pid=${pid} name=${process.name}`);
    systemEvents.emit('process.resume', { pid, name: process.name }, 'Kernel');
    
    return true;
  }

  getProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  getProcess(pid: number): ProcessInfo | undefined {
    return this.processes.get(pid);
  }

  // System Stats
  getStats(): KernelStats {
    const uptime = Date.now() - this.bootTime;
    const processCount = this.processes.size;
    const memoryUsage = Array.from(this.processes.values())
      .reduce((sum, p) => sum + (p.memory || 0), 0);
    
    return {
      uptime,
      processCount,
      memoryUsage,
      cpuTime: this.cpuTime,
      contextSwitches: this.contextSwitches
    };
  }

  // App Launcher
  launchApp(appId: string, args?: unknown) {
    systemEvents.appLaunch(appId);
    window.dispatchEvent(new CustomEvent('sys-launch-app', { detail: { appId, args } }));
  }

  // Safe Mode
  setSafeMode(enabled: boolean) {
    this.safeMode = enabled;
    kernelLog.warn('system', `Safe mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  isSafeMode(): boolean {
    return this.safeMode;
  }

  isBooted(): boolean {
    return this._booted;
  }

  // Runtime Commands (for terminal)
  getRuntimeCommands(): string[] {
    return runtimeManager.getCommands();
  }
}

export const kernel = new Kernel();
