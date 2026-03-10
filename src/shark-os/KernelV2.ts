// Shark OS Kernel v2.0 - Advanced Architecture
// Integración de todos los sistemas mejorados

import { ProcessManager, ProcessPriority, ProcessState, Process as Proc } from './kernel-v2/ProcessManager';
import { IPCBus, ipcBus } from './ipc/IPC';
import { PermissionManager, permissionManager, Capability } from './security/Permissions';
import { SandboxManager, sandboxManager, AppSandbox } from './sandbox/Sandbox';
import { VFS } from './vfs';
import { PersistentRegistry } from './registry/prefs';
import { IDBBackend, MemoryBackend } from './vfs/backends';
import { NetworkStack } from './net/stack';
import { NotificationManager } from './system/notifications';
import { PackageManagerV2, packageManager, SharkManifest } from './pkg/PackageManager';
import { AppDefinition } from '../types';

// ==================== KERNEL v2 ====================

export class KernelV2 {
  // Core systems
  public processManager = new ProcessManager();
  public ipc = ipcBus;
  public permissions = permissionManager;
  public sandboxManager = sandboxManager;
  public packageManager = packageManager;
  
  // Legacy compatibility
  public fs = new VFS();
  public registry = new PersistentRegistry();
  public notifications = new NotificationManager();
  public net = new NetworkStack();
  
  // State
  public bootTime = Date.now();
  private _booted = false;
  private _version = '15.14.0';
  
  // Built-in apps
  private readonly SYSTEM_APPS: AppDefinition[] = [
    { id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'TerminalApp', version: '4.2' },
    { id: 'files', name: 'Explorer', icon: 'Folder', component: 'FilesApp', version: '4.1' },
    { id: 'editor', name: 'Notepad', icon: 'FileText', component: 'EditorApp', version: '2.0' },
    { id: 'settings', name: 'Settings', icon: 'Settings', component: 'SettingsApp', version: '4.5' },
    { id: 'store', name: 'App Store', icon: 'ShoppingCart', component: 'StoreApp', version: '2.0' },
    { id: 'camera', name: 'Camera', icon: 'Camera', component: 'CameraApp', version: '3.0' },
    { id: 'gallery', name: 'Gallery', icon: 'Image', component: 'GalleryApp', version: '3.0' },
    { id: 'calculator', name: 'Calculator', icon: 'Calculator', component: 'CalculatorApp', version: '2.0' },
    { id: 'ide', name: 'Studio', icon: 'Code', component: 'IDEApp', version: '5.1' },
    { id: 'music', name: 'Music', icon: 'Music', component: 'MusicApp', version: '2.0' },
    { id: 'video', name: 'Videos', icon: 'Film', component: 'VideoPlayerApp', version: '2.0' },
    { id: 'paint', name: 'Paint', icon: 'Palette', component: 'PaintApp', version: '1.2' },
    { id: 'weather', name: 'Weather', icon: 'Sun', component: 'WeatherApp', version: '1.0' },
    { id: 'sys_mon', name: 'Monitor', icon: 'Activity', component: 'SystemMonitorApp', version: '2.0' },
    { id: 'clock', name: 'Clock', icon: 'Clock', component: 'ClockApp', version: '1.0' }
  ];

  async boot(): Promise<void> {
    if (this._booted) return;
    
    try {
      console.log('[Kernel v2] Starting boot sequence...');
      
      // Phase 1: Mount filesystems
      const sys = new IDBBackend('SharkOS_System', 'sys');
      const usr = new IDBBackend('SharkOS_User', 'usr');
      await sys.mount();
      await usr.mount();
      
      this.fs.mount('/tmp', new MemoryBackend());
      this.fs.mount('/user', usr);
      this.fs.mount('/', sys);
      
      // Phase 2: Initialize core directories
      const dirs = [
        '/system', '/system/apps', '/system/config',
        '/user', '/user/home', '/user/home/Documents',
        '/user/home/Pictures', '/user/home/Music',
        '/user/home/Videos', '/user/downloads',
        '/vault'
      ];
      
      for (const d of dirs) {
        if (!(await this.fs.exists(d))) {
          await this.fs.mkdir(d);
        }
      }
      
      // Phase 3: Register system apps
      for (const app of this.SYSTEM_APPS) {
        await this.fs.write(`/system/apps/${app.id}.json`, JSON.stringify(app));
      }
      
      await this.registry.set('apps.installed', this.SYSTEM_APPS.map(a => a.id));
      await this.registry.set('kernel.version', this._version);
      await this.registry.set('kernel.bootTime', this.bootTime);
      
      // Phase 4: Start process manager
      this.processManager.start();
      
      // Phase 5: Initialize IPC
      this.setupIPC();
      
      // Phase 6: Request persistent storage
      if (navigator.storage?.persist) {
        const persisted = await navigator.storage.persist();
        console.log(`[Kernel] Persistent storage: ${persisted ? 'granted' : 'denied'}`);
      }
      
      this._booted = true;
      console.log(`[Kernel v2] Boot complete - Shark OS ${this._version}`);
      
      // Broadcast boot event
      this.ipc.broadcast('sys:boot', { version: this._version, bootTime: this.bootTime });
      
    } catch (e) {
      console.error('[Kernel v2] BOOT ERROR:', e);
      throw e;
    }
  }

  private setupIPC(): void {
    // App launch handler
    this.ipc.register('sys:app:launch', async (msg) => {
      const { appId, args } = msg.payload;
      await this.launchApp(appId, args);
    });
    
    // File system operations
    this.ipc.register('fs:read', async (msg) => {
      const { path } = msg.payload;
      try {
        const content = await this.fs.cat(path);
        return { success: true, content };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    });
    
    this.ipc.register('fs:write', async (msg) => {
      const { path, data } = msg.payload;
      try {
        await this.fs.write(path, data);
        return { success: true };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    });
  }

  // ==================== PROCESS MANAGEMENT ====================
  
  spawnProcess(name: string, priority = ProcessPriority.NORMAL): number {
    const pid = this.processManager.spawn({
      name,
      priority,
      ppid: 0,
      memoryUsage: 0,
      threads: 1,
      openFiles: [],
      environment: {}
    });
    return pid;
  }
  
  killProcess(pid: number): void {
    this.processManager.kill(pid);
  }
  
  getProcesses(): Proc[] {
    return this.processManager.getAllProcesses();
  }

  // ==================== APP LAUNCH ====================
  
  async launchApp(appId: string, args?: unknown): Promise<void> {
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('sys-launch-app', { 
      detail: { appId, args } 
    }));
    
    // Create process
    this.spawnProcess(appId);
    
    // IPC broadcast
    this.ipc.broadcast('sys:app:launch', { appId, args, timestamp: Date.now() });
  }
  
  // ==================== APP MANAGEMENT ====================
  
  async installApp(packageBlob: Blob): Promise<{ success: boolean; appId?: string; error?: string }> {
    const result = await this.packageManager.install(packageBlob);
    if (result.success && result.appId) {
      const manifest = this.packageManager.getApp(result.appId);
      if (manifest) {
        await this.fs.write(`/system/apps/${manifest.id}.json`, JSON.stringify({
          id: manifest.id,
          name: manifest.name,
          icon: manifest.icon || 'Default',
          component: 'InstalledApp',
          version: manifest.version
        }));
      }
    }
    return result;
  }
  
  async uninstallApp(appId: string): Promise<boolean> {
    const success = await this.packageManager.uninstall(appId);
    if (success) {
      // Kill any running processes
      const processes = this.processManager.getAllProcesses().filter(p => p.name === appId);
      for (const p of processes) {
        this.processManager.kill(p.pid);
      }
    }
    return success;
  }

  // ==================== SYSTEM INFO ====================
  
  getVersion(): string {
    return this._version;
  }
  
  isBooted(): boolean {
    return this._booted;
  }
  
  getUptime(): number {
    return Date.now() - this.bootTime;
  }
  
  getStats() {
    return {
      version: this._version,
      uptime: this.getUptime(),
      processes: this.processManager.getAllProcesses().length,
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      ...this.processManager.getStats()
    };
  }
}

// Singleton
export const kernelV2 = new KernelV2();

// Legacy export for compatibility
export const kernel = kernelV2;
