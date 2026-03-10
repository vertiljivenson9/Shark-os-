'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { kernel } from './services/kernel';
import { WindowState, AppDefinition } from './types';
import { Window } from './components/Window';
import { StatusBar } from './components/StatusBar';
import { LockScreen } from './components/LockScreen';
import { BiosScreen } from './components/BiosScreen';
import { SplashScreen } from './components/SplashScreen';
import { ControlCenter } from './components/ControlCenter';
import { TerminalApp } from './apps/TerminalApp';
import { EditorApp } from './apps/EditorApp';
import { SettingsApp } from './apps/SettingsApp';
import { FilesApp } from './apps/FilesApp';
import { SearchApp } from './apps/SearchApp';
import { CameraApp } from './apps/CameraApp';
import { GalleryApp } from './apps/GalleryApp';
import { CalculatorApp } from './apps/CalculatorApp';
import { IDEApp } from './apps/IDEApp';
import { GitSyncApp } from './apps/GitSyncApp';
import { MusicApp } from './apps/MusicApp';
import { VideoPlayerApp } from './apps/VideoPlayerApp';
import { PaintApp } from './apps/PaintApp';
import { NewsApp } from './apps/NewsApp';
import { TimelineApp } from './apps/TimelineApp';
import { SystemMonitorApp } from './apps/SystemMonitorApp';
import { ZipExportApp } from './apps/ZipExportApp';
import { ClockApp } from './apps/ClockApp';
import { StoreApp } from './apps/StoreApp';
import { WeatherApp } from './apps/WeatherApp';
import { NexusFluxApp } from './apps/NexusFluxApp';
import { Terminal, Folder, Settings, Search, Camera, Image, Calculator, Code, Zap, Grid, ShoppingCart, Globe, Music, Film, Cloud, Palette, History, Activity, Archive, Clock, Sun, Newspaper, FileText } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
  Terminal: <Terminal size={32} className="text-gray-300" />,
  Folder: <Folder size={32} className="text-yellow-400" />,
  Settings: <Settings size={32} className="text-gray-400" />,
  Search: <Search size={32} className="text-blue-400" />,
  Camera: <Camera size={32} className="text-red-400" />,
  Image: <Image size={32} className="text-purple-400" />,
  Calculator: <Calculator size={32} className="text-orange-400" />,
  Code: <Code size={32} className="text-blue-500" />,
  Zap: <Zap size={32} className="text-cyan-400" />,
  ShoppingCart: <ShoppingCart size={32} className="text-green-500" />,
  Globe: <Globe size={32} className="text-sky-400" />,
  Music: <Music size={32} className="text-pink-400" />,
  Film: <Film size={32} className="text-indigo-400" />,
  Cloud: <Cloud size={32} className="text-white" />,
  Palette: <Palette size={32} className="text-rose-400" />,
  History: <History size={32} className="text-emerald-400" />,
  Activity: <Activity size={32} className="text-lime-400" />,
  Archive: <Archive size={32} className="text-amber-600" />,
  Clock: <Clock size={32} className="text-blue-300" />,
  Sun: <Sun size={32} className="text-yellow-400" />,
  Newspaper: <Newspaper size={32} className="text-orange-500" />,
  FileText: <FileText size={32} className="text-blue-300" />,
  Default: <Grid size={32} className="text-gray-500" />
};

// Apps por defecto - CARGAN INMEDIATAMENTE
const DEFAULT_APPS: AppDefinition[] = [
  { id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'TerminalApp', version: '4.2' },
  { id: 'files', name: 'Explorer', icon: 'Folder', component: 'FilesApp', version: '4.1' },
  { id: 'editor', name: 'Notepad', icon: 'FileText', component: 'EditorApp', version: '2.0' },
  { id: 'settings', name: 'Settings', icon: 'Settings', component: 'SettingsApp', version: '4.5' },
  { id: 'store', name: 'App Store', icon: 'ShoppingCart', component: 'StoreApp', version: '1.5' },
  { id: 'camera', name: 'Camera', icon: 'Camera', component: 'CameraApp', version: '3.0' },
  { id: 'gallery', name: 'Gallery', icon: 'Image', component: 'GalleryApp', version: '3.0' },
  { id: 'calculator', name: 'Calculator', icon: 'Calculator', component: 'CalculatorApp', version: '2.0' },
  { id: 'ide', name: 'Studio', icon: 'Code', component: 'IDEApp', version: '5.1' },
  { id: 'git_sync', name: 'Replicator', icon: 'Zap', component: 'GitSyncApp', version: '15.13' },
  { id: 'nexus_flux', name: 'Nexus Flux', icon: 'Zap', component: 'NexusFluxApp', version: '1.0' },
  { id: 'music', name: 'Music', icon: 'Music', component: 'MusicApp', version: '2.0' },
  { id: 'video', name: 'Videos', icon: 'Film', component: 'VideoPlayerApp', version: '2.0' },
  { id: 'paint', name: 'Paint', icon: 'Palette', component: 'PaintApp', version: '1.2' },
  { id: 'news', name: 'News', icon: 'Newspaper', component: 'NewsApp', version: '1.1' },
  { id: 'weather', name: 'Weather', icon: 'Sun', component: 'WeatherApp', version: '1.0' },
  { id: 'timeline', name: 'Timeline', icon: 'History', component: 'TimelineApp', version: '1.0' },
  { id: 'sys_mon', name: 'Monitor', icon: 'Activity', component: 'SystemMonitorApp', version: '2.0' },
  { id: 'zip_export', name: 'Backup', icon: 'Archive', component: 'ZipExportApp', version: '1.0' },
  { id: 'clock', name: 'Clock', icon: 'Clock', component: 'ClockApp', version: '1.0' }
];

const SharkOSApp: React.FC = () => {
  const [showBios, setShowBios] = useState(true);
  const [booted, setBooted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [installedApps, setInstalledApps] = useState<AppDefinition[]>(DEFAULT_APPS);
  const [activeWinId, setActiveWinId] = useState<string | null>(null);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564');
  const [brightness, setBrightness] = useState(100);

  const focusWin = useCallback((id: string) => {
    setActiveWinId(id);
    setWindows(prev => {
        const maxZ = Math.max(...prev.map(w => w.zIndex), 100);
        return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w);
    });
  }, []);

  const closeWin = useCallback((id: string) => {
    setWindows(prev => {
        const w = prev.find(x => x.id === id);
        if (w) kernel.killProcess(w.processId);
        return prev.filter(x => x.id !== id);
    });
    setActiveWinId(prev => prev === id ? null : prev);
  }, []);

  const launchApp = useCallback((app: AppDefinition, args?: unknown) => {
    setWindows(prev => {
      const existing = prev.find(w => w.appId === app.id);
      if (existing) {
          const maxZ = Math.max(...prev.map(w => w.zIndex), 100);
          setActiveWinId(existing.id);
          return prev.map(w => w.id === existing.id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w);
      }

      const id = crypto.randomUUID();
      const pid = kernel.spawnProcess(app.name);
      const isMobile = window.innerWidth < 768;

      const newWin: WindowState = {
          id, appId: app.id, title: app.name,
          x: isMobile ? '2vw' : 40 + (prev.length * 30),
          y: isMobile ? 50 : 60 + (prev.length * 30),
          width: isMobile ? '96vw' : 780,
          height: isMobile ? '78vh' : 580,
          isMinimized: false, isMaximized: false,
          zIndex: Math.max(...prev.map(w => w.zIndex), 100) + 1,
          processId: pid, args
      };
      setActiveWinId(id);
      return [...prev, newWin];
    });
  }, []);

  const startBoot = async () => {
    setShowBios(false);
    setShowSplash(true);
    
    // Boot kernel en background
    kernel.boot().catch(console.error);
    
    // Mostrar splash por 2 segundos
    setTimeout(() => {
      setBooted(true);
      setShowSplash(false);
    }, 2000);
  };

  useEffect(() => {
    const handleLaunch = (e: CustomEvent) => {
      const { appId, args } = e.detail;
      const app = installedApps.find(a => a.id === appId);
      if (app) launchApp(app, args);
    };
    window.addEventListener('sys-launch-app', handleLaunch as EventListener);
    return () => window.removeEventListener('sys-launch-app', handleLaunch as EventListener);
  }, [installedApps, launchApp]);

  const renderContent = (win: WindowState) => {
    switch(win.appId) {
      case 'settings': return <SettingsApp />;
      case 'terminal': return <TerminalApp />;
      case 'files': return <FilesApp />;
      case 'search': return <SearchApp />;
      case 'camera': return <CameraApp />;
      case 'gallery': return <GalleryApp />;
      case 'calculator': return <CalculatorApp />;
      case 'ide': return <IDEApp />;
      case 'git_sync': return <GitSyncApp />;
      case 'music': return <MusicApp file={win.args?.file} />;
      case 'video': return <VideoPlayerApp file={win.args?.file} />;
      case 'paint': return <PaintApp />;
      case 'news': return <NewsApp />;
      case 'timeline': return <TimelineApp />;
      case 'sys_mon': return <SystemMonitorApp />;
      case 'zip_export': return <ZipExportApp />;
      case 'clock': return <ClockApp />;
      case 'editor': return <EditorApp file={win.args?.file} />;
      case 'store': return <StoreApp />;
      case 'weather': return <WeatherApp />;
      case 'nexus_flux': return <NexusFluxApp />;
      default: return <div className="p-4 text-white font-mono text-xs">Loading {win.appId}...</div>;
    }
  };

  if (showBios) return <BiosScreen onComplete={startBoot} />;
  if (!booted) return <div className="h-screen bg-black text-blue-500 font-mono flex items-center justify-center animate-pulse tracking-[0.5em]">SHARK_OS...</div>;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-black" style={{ filter: `brightness(${brightness}%)` }}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <StatusBar onToggleControlCenter={() => setShowControlCenter(!showControlCenter)} />
      {isLocked && <LockScreen wallpaper={wallpaper} onUnlock={() => setIsLocked(false)} />}

      {/* DESKTOP CON APPS */}
      <div className="absolute inset-0" style={{ backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          <div className="absolute inset-0 p-4 pt-12 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 content-start overflow-y-auto no-scrollbar pb-24">
            {installedApps.map(app => (
              <div key={app.id} className="flex flex-col items-center group cursor-pointer active:scale-90 transition-all" onClick={() => launchApp(app)}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all shadow-xl hover:scale-105">
                  <div className="scale-75 sm:scale-100">{ICONS[app.icon] || ICONS['Default']}</div>
                </div>
                <span className="mt-2 text-[9px] sm:text-[10px] font-bold text-white/90 group-hover:text-white uppercase tracking-wider text-center truncate w-full px-1 drop-shadow-lg">{app.name}</span>
              </div>
            ))}
          </div>
      </div>

      {/* VENTANAS */}
      <div className="absolute inset-0 pointer-events-none z-20 flex justify-center">
        {windows.map(win => (
            <Window
                key={win.id}
                state={win}
                onClose={closeWin}
                onMinimize={id => setWindows(p => p.map(w => w.id === id ? {...w, isMinimized: true} : w))}
                onMaximize={id => setWindows(p => p.map(w => w.id === id ? {...w, isMaximized: !w.isMaximized} : w))}
                onFocus={focusWin}
                onUpdate={(id, up) => setWindows(p => p.map(w => w.id === id ? {...w, ...up} : w))}
            >
                {renderContent(win)}
            </Window>
        ))}
      </div>

      {/* DOCK */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-3xl border border-white/10 rounded-2xl sm:rounded-[2rem] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-2xl z-50 transition-all hover:bg-black/60 max-w-[95vw] overflow-x-auto no-scrollbar">
        {windows.map(win => (
            <div key={win.id} onClick={() => focusWin(win.id)} className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${activeWinId === win.id && !win.isMinimized ? 'bg-blue-500 shadow-[0_0_20px_#3b82f6] scale-110' : 'bg-white/10 hover:bg-white/20'}`}>
                <div className="scale-50">{ICONS[installedApps.find(a => a.id === win.appId)?.icon || 'Default']}</div>
            </div>
        ))}
        {windows.length > 0 && <div className="w-px h-6 bg-white/20 mx-1 shrink-0" />}
        <button onClick={() => setWindows(prev => prev.map(w => ({...w, isMinimized: true})))} className="p-2 sm:p-2.5 text-gray-400 hover:text-white transition-all shrink-0 hover:bg-white/10 rounded-xl"><Grid size={18} /></button>
      </div>
      
      <ControlCenter isOpen={showControlCenter} onClose={() => setShowControlCenter(false)} notifications={kernel.notifications.getHistory()} />
    </div>
  );
};

export default SharkOSApp;
