'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { kernel } from './services/kernel';
import { WindowState, AppDefinition } from './types';
import { Window } from './components/Window';
import { StatusBar } from './components/StatusBar';
import { LockScreen } from './components/LockScreen';
import { BiosScreen } from './components/BiosScreen';
import { SplashScreen } from './components/SplashScreen';
import { ControlCenter } from './components/ControlCenter';
import { ToastContainer, toast } from './components/Toast';
import { soundSystem } from './services/media/SoundSystem';
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
import { DeveloperApp } from './apps/DeveloperApp';
import { 
  Terminal, Folder, Settings, Search, Camera, Image, Calculator, Code, 
  Zap, Grid, ShoppingCart, Globe, Music, Film, Cloud, Palette, History, 
  Activity, Archive, Clock, Sun, Newspaper, FileText, Menu, X, ChevronRight,
  Cpu, Wrench
} from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
  Terminal: <Terminal size={28} className="text-gray-300" />,
  Folder: <Folder size={28} className="text-yellow-400" />,
  Settings: <Settings size={28} className="text-gray-400" />,
  Search: <Search size={28} className="text-blue-400" />,
  Camera: <Camera size={28} className="text-red-400" />,
  Image: <Image size={28} className="text-purple-400" />,
  Calculator: <Calculator size={28} className="text-orange-400" />,
  Code: <Code size={28} className="text-blue-500" />,
  Zap: <Zap size={28} className="text-cyan-400" />,
  ShoppingCart: <ShoppingCart size={28} className="text-green-500" />,
  Globe: <Globe size={28} className="text-sky-400" />,
  Music: <Music size={28} className="text-pink-400" />,
  Film: <Film size={28} className="text-indigo-400" />,
  Cloud: <Cloud size={28} className="text-white" />,
  Palette: <Palette size={28} className="text-rose-400" />,
  History: <History size={28} className="text-emerald-400" />,
  Activity: <Activity size={28} className="text-lime-400" />,
  Archive: <Archive size={28} className="text-amber-600" />,
  Clock: <Clock size={28} className="text-blue-300" />,
  Sun: <Sun size={28} className="text-yellow-400" />,
  Newspaper: <Newspaper size={28} className="text-orange-500" />,
  FileText: <FileText size={28} className="text-blue-300" />,
  Cpu: <Cpu size={28} className="text-purple-400" />,
  Wrench: <Wrench size={28} className="text-gray-400" />,
  Default: <Grid size={28} className="text-gray-500" />
};

// Apps por defecto - ordenadas por importancia
const DEFAULT_APPS: AppDefinition[] = [
  { id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'TerminalApp', version: '4.2' },
  { id: 'files', name: 'Explorer', icon: 'Folder', component: 'FilesApp', version: '4.1' },
  { id: 'developer', name: 'DevTools', icon: 'Cpu', component: 'DeveloperApp', version: '1.0' },
  { id: 'settings', name: 'Settings', icon: 'Settings', component: 'SettingsApp', version: '4.5' },
  { id: 'store', name: 'App Store', icon: 'ShoppingCart', component: 'StoreApp', version: '1.5' },
  { id: 'ide', name: 'Studio', icon: 'Code', component: 'IDEApp', version: '5.1' },
  { id: 'sys_mon', name: 'Monitor', icon: 'Activity', component: 'SystemMonitorApp', version: '2.0' },
  { id: 'paint', name: 'Paint', icon: 'Palette', component: 'PaintApp', version: '2.0' },
  { id: 'editor', name: 'Notepad', icon: 'FileText', component: 'EditorApp', version: '2.0' },
  { id: 'camera', name: 'Camera', icon: 'Camera', component: 'CameraApp', version: '3.0' },
  { id: 'gallery', name: 'Gallery', icon: 'Image', component: 'GalleryApp', version: '3.0' },
  { id: 'calculator', name: 'Calculator', icon: 'Calculator', component: 'CalculatorApp', version: '2.0' },
  { id: 'git_sync', name: 'Replicator', icon: 'Zap', component: 'GitSyncApp', version: '15.13' },
  { id: 'music', name: 'Music', icon: 'Music', component: 'MusicApp', version: '2.0' },
  { id: 'video', name: 'Videos', icon: 'Film', component: 'VideoPlayerApp', version: '2.0' },
  { id: 'news', name: 'News', icon: 'Newspaper', component: 'NewsApp', version: '1.1' },
  { id: 'weather', name: 'Weather', icon: 'Sun', component: 'WeatherApp', version: '1.0' },
  { id: 'timeline', name: 'Timeline', icon: 'History', component: 'TimelineApp', version: '1.0' },
  { id: 'zip_export', name: 'Backup', icon: 'Archive', component: 'ZipExportApp', version: '1.0' },
  { id: 'clock', name: 'Clock', icon: 'Clock', component: 'ClockApp', version: '1.0' },
  { id: 'nexus_flux', name: 'Nexus', icon: 'Zap', component: 'NexusFluxApp', version: '1.0' }
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
  const [isMobile, setIsMobile] = useState(false);
  const [showAppDrawer, setShowAppDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const audioInitialized = useRef(false);

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Inicializar sonido
  useEffect(() => {
    if (!audioInitialized.current) {
      soundSystem.init().then(() => {
        audioInitialized.current = true;
      });
    }
  }, []);

  // Escuchar cambios de wallpaper y brightness desde Settings
  useEffect(() => {
    const handleWallpaperChange = (e: CustomEvent) => {
      if (e.detail) {
        setWallpaper(e.detail);
        toast.success('Wallpaper actualizado');
      }
    };
    
    const handleBrightnessChange = (e: CustomEvent) => {
      if (e.detail) {
        setBrightness(e.detail);
      }
    };

    window.addEventListener('sys-wallpaper-change', handleWallpaperChange as EventListener);
    window.addEventListener('sys-brightness-change', handleBrightnessChange as EventListener);
    
    return () => {
      window.removeEventListener('sys-wallpaper-change', handleWallpaperChange as EventListener);
      window.removeEventListener('sys-brightness-change', handleBrightnessChange as EventListener);
    };
  }, []);

  // Apps filtradas para búsqueda
  const filteredApps = installedApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const focusWin = useCallback((id: string) => {
    setActiveWinId(id);
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), 100);
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w);
    });
  }, []);

  const closeWin = useCallback((id: string) => {
    soundSystem.play('close');
    setWindows(prev => {
      const w = prev.find(x => x.id === id);
      if (w) kernel.killProcess(w.processId);
      return prev.filter(x => x.id !== id);
    });
    setActiveWinId(prev => prev === id ? null : prev);
  }, []);

  const launchApp = useCallback((app: AppDefinition, args?: unknown) => {
    // Cerrar drawer en móvil
    setShowAppDrawer(false);
    
    soundSystem.play('open');
    toast.info(`Abriendo ${app.name}...`);
    
    setWindows(prev => {
      const existing = prev.find(w => w.appId === app.id);
      if (existing) {
        const maxZ = Math.max(...prev.map(w => w.zIndex), 100);
        setActiveWinId(existing.id);
        return prev.map(w => w.id === existing.id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w);
      }

      const id = crypto.randomUUID();
      const pid = kernel.spawnProcess(app.name);
      const mobile = window.innerWidth < 768;

      const newWin: WindowState = {
        id, appId: app.id, title: app.name,
        x: mobile ? '0' : 40 + (prev.length * 30),
        y: mobile ? '24px' : 60 + (prev.length * 30),
        width: mobile ? '100vw' : 780,
        height: mobile ? 'calc(100vh - 24px - 60px)' : 580,
        isMinimized: false, isMaximized: mobile,
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
    
    // Sonido de boot
    soundSystem.play('boot');
    
    // Boot kernel en background
    kernel.boot().catch(console.error);
    
    // Mostrar splash por 2 segundos
    setTimeout(() => {
      setBooted(true);
      setShowSplash(false);
      soundSystem.play('login');
      
      // Bienvenida
      setTimeout(() => {
        toast.success('¡Bienvenido a Shark OS!', 'Sistema listo');
      }, 500);
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
      case 'developer': return <DeveloperApp />;
      case 'git_sync': return <GitSyncApp />;
      case 'music': return <MusicApp file={win.args?.file} />;
      case 'video': return <VideoPlayerApp file={win.args?.file} />;
      case 'paint': return <PaintApp />;
      case 'news': return <NewsApp />;
      case 'weather': return <WeatherApp />;
      case 'timeline': return <TimelineApp />;
      case 'sys_mon': return <SystemMonitorApp />;
      case 'zip_export': return <ZipExportApp />;
      case 'clock': return <ClockApp />;
      case 'editor': return <EditorApp file={win.args?.file} />;
      case 'store': return <StoreApp />;
      case 'nexus_flux': return <NexusFluxApp />;
      default: return <div className="p-4 text-white font-mono text-xs">Loading {win.appId}...</div>;
    }
  };

  if (showBios) return <BiosScreen onComplete={startBoot} />;
  if (!booted) return <div className="h-screen bg-black text-blue-500 font-mono flex items-center justify-center animate-pulse tracking-[0.5em]">SHARK_OS...</div>;

  return (
    <div 
      className="h-screen w-screen overflow-hidden relative bg-black select-none" 
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {/* Toast Container */}
      <ToastContainer />
      
      <StatusBar onToggleControlCenter={() => setShowControlCenter(!showControlCenter)} />
      
      {isLocked && <LockScreen wallpaper={wallpaper} onUnlock={() => {
        setIsLocked(false);
        soundSystem.play('unlock');
      }} />}

      {/* DESKTOP CON WALLPAPER */}
      <div 
        className="absolute inset-0" 
        style={{ backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        
        {/* Grid de apps - Solo en desktop */}
        {!isMobile && (
          <div className="absolute inset-0 p-4 pt-12 grid grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 content-start overflow-y-auto no-scrollbar pb-24">
            {installedApps.map(app => (
              <div 
                key={app.id} 
                className="flex flex-col items-center group cursor-pointer active:scale-90 transition-all" 
                onClick={() => launchApp(app)}
              >
                <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all shadow-xl hover:scale-105 hover:shadow-2xl">
                  {ICONS[app.icon] || ICONS['Default']}
                </div>
                <span className="mt-2 text-[10px] font-bold text-white/90 group-hover:text-white uppercase tracking-wider text-center truncate w-full px-1 drop-shadow-lg">
                  {app.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Layout móvil - Pantalla de inicio con todas las apps */}
        {isMobile && (
          <>
            {/* Home screen con todas las apps en grid desplazable */}
            <div className="absolute inset-0 pt-12 pb-20 px-3 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-4 gap-3 content-start pb-4">
                {installedApps.map(app => (
                  <div 
                    key={app.id} 
                    className="flex flex-col items-center active:scale-90 transition-transform"
                    onClick={() => launchApp(app)}
                  >
                    <div className="w-14 h-14 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                      <div className="scale-75">{ICONS[app.icon] || ICONS['Default']}</div>
                    </div>
                    <span className="mt-1.5 text-[9px] font-semibold text-white/80 truncate w-full text-center">
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* App Drawer Modal con búsqueda */}
            {showAppDrawer && (
              <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl animate-slide-up">
                <div className="pt-14 px-4 pb-4 h-full flex flex-col">
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar apps..."
                      className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/30"
                    />
                  </div>
                  
                  {/* Apps grid */}
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-4 gap-3">
                      {filteredApps.map(app => (
                        <div 
                          key={app.id} 
                          className="flex flex-col items-center active:scale-90 transition-transform py-2"
                          onClick={() => launchApp(app)}
                        >
                          <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10">
                            <div className="scale-75">{ICONS[app.icon] || ICONS['Default']}</div>
                          </div>
                          <span className="mt-1.5 text-[9px] font-medium text-white/70 truncate w-full text-center">
                            {app.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Swipe indicator */}
                  <div 
                    className="flex justify-center py-4 cursor-pointer"
                    onClick={() => setShowAppDrawer(false)}
                  >
                    <div className="w-12 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* VENTANAS */}
      <div className={`absolute inset-0 pointer-events-none z-20 ${isMobile ? '' : 'flex justify-center items-center'}`}>
        {windows.map(win => (
          <Window
            key={win.id}
            state={win}
            onClose={closeWin}
            onMinimize={id => {
              soundSystem.play('minimize');
              setWindows(p => p.map(w => w.id === id ? {...w, isMinimized: true} : w));
            }}
            onMaximize={id => {
              soundSystem.play('maximize');
              setWindows(p => p.map(w => w.id === id ? {...w, isMaximized: !w.isMaximized} : w));
            }}
            onFocus={focusWin}
            onUpdate={(id, up) => setWindows(p => p.map(w => w.id === id ? {...w, ...up} : w))}
          >
            {renderContent(win)}
          </Window>
        ))}
      </div>

      {/* DOCK / BOTTOM BAR */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 ${isMobile ? 'h-16' : 'h-auto'}`}>
        {isMobile ? (
          // Dock móvil
          <div className="h-full bg-black/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2">
            {/* Botón apps */}
            <button 
              onClick={() => setShowAppDrawer(true)}
              className="p-3 rounded-xl active:bg-white/10 transition-colors"
            >
              <Grid size={24} className="text-white/80" />
            </button>
            
            {/* Apps abiertas */}
            {windows.slice(0, 3).map(win => (
              <button
                key={win.id}
                onClick={() => focusWin(win.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  activeWinId === win.id && !win.isMinimized 
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/40 scale-105' 
                    : 'bg-white/10 active:bg-white/20'
                }`}
              >
                <div className="scale-50">{ICONS[installedApps.find(a => a.id === win.appId)?.icon || 'Default']}</div>
              </button>
            ))}
            
            {/* Botón minimizar todo */}
            {windows.length > 0 && (
              <button 
                onClick={() => setWindows(prev => prev.map(w => ({...w, isMinimized: true})))}
                className="p-3 rounded-xl active:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            )}
          </div>
        ) : (
          // Dock desktop
          <div className="flex justify-center pb-4">
            <div className="bg-black/50 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-4 py-2.5 flex items-center gap-3 shadow-2xl hover:bg-black/60 transition-all max-w-[80vw]">
              {windows.map(win => (
                <div 
                  key={win.id} 
                  onClick={() => focusWin(win.id)} 
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    activeWinId === win.id && !win.isMinimized 
                      ? 'bg-blue-500 shadow-[0_0_20px_#3b82f6] scale-110' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="scale-50">{ICONS[installedApps.find(a => a.id === win.appId)?.icon || 'Default']}</div>
                </div>
              ))}
              {windows.length > 0 && <div className="w-px h-6 bg-white/20 mx-1" />}
              <button 
                onClick={() => setWindows(prev => prev.map(w => ({...w, isMinimized: true})))} 
                className="p-2.5 text-gray-400 hover:text-white transition-all hover:bg-white/10 rounded-xl"
              >
                <Grid size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ControlCenter isOpen={showControlCenter} onClose={() => setShowControlCenter(false)} notifications={kernel.notifications.getHistory()} />
    </div>
  );
};

export default SharkOSApp;
