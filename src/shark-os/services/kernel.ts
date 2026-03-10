
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
import { AppDefinition } from '../types';

export class Kernel {
  public fs = new VFS();
  public registry = new PersistentRegistry();
  public scheduler = new Scheduler();
  public net = new NetworkStack();
  public history = new HistoryService();
  public notifications = new NotificationManager();
  public pkg = new PackageManager();
  public voice = new VoiceControl();
  public audio = new AudioMixer();
  
  public bootTime = Date.now();
  private _booted = false;

  async boot() {
    if (this._booted) return;
    try {
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

      const dirs = ['/system', '/system/apps', '/user/home', '/user/home/photos'];
      for (const d of dirs) {
        if (!(await this.fs.exists(d))) await this.fs.mkdir(d);
      }

      // LISTA MAESTRA DE APLICACIONES v15.14
      const apps: AppDefinition[] = [
        { id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'TerminalApp', version: '4.2' },
        { id: 'files', name: 'Explorer', icon: 'Folder', component: 'FilesApp', version: '4.1' },
        { id: 'editor', name: 'Notepad', icon: 'FileText', component: 'EditorApp', version: '2.0' },
        { id: 'settings', name: 'Ajustes', icon: 'Settings', component: 'SettingsApp', version: '4.5' },
        { id: 'store', name: 'App Store', icon: 'ShoppingCart', component: 'StoreApp', version: '1.5' },
        { id: 'camera', name: 'Cámara', icon: 'Camera', component: 'CameraApp', version: '3.0' },
        { id: 'gallery', name: 'Galería', icon: 'Image', component: 'GalleryApp', version: '3.0' },
        { id: 'calculator', name: 'Calculadora', icon: 'Calculator', component: 'CalculatorApp', version: '2.0' },
        { id: 'ide', name: 'Studio', icon: 'Code', component: 'IDEApp', version: '5.1' },
        { id: 'git_sync', name: 'Replicator', icon: 'Zap', component: 'GitSyncApp', version: '15.13' },
        { id: 'nexus_flux', name: 'Nexus Flux', icon: 'Zap', component: 'NexusFluxApp', version: '1.0' },
        { id: 'music', name: 'Música', icon: 'Music', component: 'MusicApp', version: '2.0' },
        { id: 'video', name: 'Videos', icon: 'Film', component: 'VideoPlayerApp', version: '2.0' },
        { id: 'paint', name: 'Paint', icon: 'Palette', component: 'PaintApp', version: '1.2' },
        { id: 'news', name: 'Noticias', icon: 'Newspaper', component: 'NewsApp', version: '1.1' },
        { id: 'weather', name: 'Clima', icon: 'Sun', component: 'WeatherApp', version: '1.0' },
        { id: 'timeline', name: 'Timeline', icon: 'History', component: 'TimelineApp', version: '1.0' },
        { id: 'sys_mon', name: 'Monitor', icon: 'Activity', component: 'SystemMonitorApp', version: '2.0' },
        { id: 'zip_export', name: 'Backup', icon: 'Archive', component: 'ZipExportApp', version: '1.0' },
        { id: 'clock', name: 'Reloj', icon: 'Clock', component: 'ClockApp', version: '1.0' }
      ];

      for (const app of apps) {
        await this.fs.write(`/system/apps/${app.id}.json`, JSON.stringify(app));
      }
      
      await this.registry.set('apps.installed', apps.map(a => a.id));

      this.scheduler.start();
      this._booted = true;
      this.history.record('kernel', 'Sistema Shark OS Apex v15.14 Online - Recreación de apps completada.');
    } catch (e) {
      console.error('CRITICAL BOOT ERROR', e);
    }
  }

  spawnProcess(name: string) {
    const pid = Math.floor(Math.random() * 1000);
    this.scheduler.add({ pid, name, status: 'running', startTime: Date.now(), priority: 1 });
    return pid;
  }

  killProcess(pid: number) { this.scheduler.remove(pid); }
  getProcesses() { return this.scheduler.getAll(); }
  launchApp(appId: string, args?: any) {
    window.dispatchEvent(new CustomEvent('sys-launch-app', { detail: { appId, args } }));
  }
}

export const kernel = new Kernel();
