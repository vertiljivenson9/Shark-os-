'use client';

import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { soundSystem } from '../services/media/SoundSystem';
import { toast } from '../components/Toast';
import { 
  Monitor, Lock, Cpu, Palette, Key, Download, Save, CheckCircle, 
  Smartphone, ShieldCheck, Zap, Trash2, ShieldAlert, Fingerprint, 
  Activity, Shield, Volume2, VolumeX, Bell, Vibrate, Sun, Moon,
  Wifi, Bluetooth, Battery, HardDrive, Database, Info, ChevronRight,
  ToggleLeft, ToggleRight, Speaker
} from 'lucide-react';

const WALLPAPERS = [
  { name: 'Shark Apex', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564' },
  { name: 'Neon City', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=2000' },
  { name: 'Abyssal Blue', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000' },
  { name: 'Cyber Grid', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000' },
  { name: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2000' },
  { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000' }
];

type TabType = 'display' | 'sound' | 'security' | 'system' | 'about';

interface SoundSettings {
  enabled: boolean;
  volume: number;
  notifications: boolean;
  keystroke: boolean;
  haptic: boolean;
}

export const SettingsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('display');
  const [pin, setPin] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [br, setBr] = useState(100);
  const [wp, setWp] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    enabled: true,
    volume: 50,
    notifications: true,
    keystroke: false,
    haptic: true
  });

  useEffect(() => {
    const load = async () => {
      const storedPin = await kernel.registry.get('system.security.pin');
      if (storedPin) {
        setPin(storedPin);
        setHasPin(true);
      }
      const currentBr = await kernel.registry.get('user.display.brightness');
      setBr(currentBr !== undefined ? Number(currentBr) : 100);
      setWp(await kernel.registry.get('user.desktop.wallpaper') || WALLPAPERS[0].url);
      
      // Cargar configuración de sonido
      const savedSound = localStorage.getItem('shark-sound-settings');
      if (savedSound) {
        const parsed = JSON.parse(savedSound);
        setSoundSettings(prev => ({ ...prev, ...parsed }));
      }
    };
    load();
  }, []);

  const saveConfig = async (key: string, val: any) => {
    await kernel.registry.set(key, val);
    if (kernel.registry.flush) await kernel.registry.flush();
    window.dispatchEvent(new CustomEvent('sys-config-update'));
    showStatus("GUARDADO");
    soundSystem.play('click');
  };

  const saveSoundSettings = (newSettings: Partial<SoundSettings>) => {
    const updated = { ...soundSettings, ...newSettings };
    setSoundSettings(updated);
    
    if ('enabled' in newSettings) {
      soundSystem.setEnabled(newSettings.enabled!);
    }
    if ('volume' in newSettings) {
      soundSystem.setVolume(newSettings.volume! / 100);
    }
    
    localStorage.setItem('shark-sound-settings', JSON.stringify(updated));
    toast.success('Configuración de sonido actualizada');
  };

  const handleSetPin = async () => {
    if (pin.length < 4) {
      toast.error('PIN inválido', 'Debe tener al menos 4 dígitos');
      return;
    }
    await saveConfig('system.security.pin', pin);
    setHasPin(true);
    showStatus("SEGURIDAD_ACTIVA");
  };

  const clearSecurity = async () => {
    if (confirm("¿ADVERTENCIA: Desactivar toda la seguridad del núcleo?")) {
      await kernel.registry.delete('system.security.pin');
      if (kernel.registry.flush) await kernel.registry.flush();
      setPin('');
      setHasPin(false);
      showStatus("MODO_ABIERTO");
    }
  };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2000);
  };

  const downloadApexKey = () => {
    if (!pin) return;
    const keyData = {
      header: "SHARK_OS_SECURITY_TOKEN_v2",
      version: "15.13",
      created: new Date().toISOString(),
      identity: "MASTER_ID_00",
      payload: btoa(`pin:${pin}:${Date.now()}`)
    };
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/shark-key' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SharkMaster.sharkkey`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Llave exportada', 'Guarda este archivo en un lugar seguro');
    soundSystem.play('download');
  };

  const testSound = (type: 'notification' | 'success' | 'warning' | 'error' | 'click') => {
    soundSystem.play(type);
  };

  // Toggle Component
  const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <button 
      onClick={onToggle}
      className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-1 ${
        enabled ? 'bg-blue-500' : 'bg-gray-700'
      }`}
    >
      <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );

  // Slider Component
  const Slider: React.FC<{ value: number; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-blue-400 font-mono text-xs font-bold">{value}%</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value} 
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer 
          [&::-webkit-slider-thumb]:appearance-none 
          [&::-webkit-slider-thumb]:w-4 
          [&::-webkit-slider-thumb]:h-4 
          [&::-webkit-slider-thumb]:rounded-full 
          [&::-webkit-slider-thumb]:bg-blue-500
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-blue-500/50"
      />
    </div>
  );

  // Setting Item Component
  const SettingItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    action: React.ReactNode;
    onClick?: () => void;
  }> = ({ icon, title, description, action, onClick }) => (
    <div 
      className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all ${onClick ? 'hover:bg-white/10 cursor-pointer active:scale-[0.99]' : ''}`}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {description && <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );

  return (
    <div className="h-full flex bg-[#0a0a0a] text-gray-200 font-sans select-none overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 sm:w-56 border-r border-white/5 bg-black/50 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
        <div className="py-6 flex justify-center border-b border-white/5">
          <h1 className="hidden sm:flex text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] items-center gap-2">
            <ShieldCheck size={12}/> AJUSTES
          </h1>
          <ShieldCheck size={20} className="sm:hidden text-blue-500" />
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'display' as TabType, icon: Monitor, label: 'Pantalla', color: 'blue' },
            { id: 'sound' as TabType, icon: Volume2, label: 'Sonido', color: 'purple' },
            { id: 'security' as TabType, icon: Lock, label: 'Seguridad', color: 'emerald' },
            { id: 'system' as TabType, icon: Cpu, label: 'Sistema', color: 'orange' },
            { id: 'about' as TabType, icon: Info, label: 'Acerca de', color: 'cyan' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); soundSystem.play('click'); }} 
              className={`w-full aspect-square sm:aspect-auto sm:h-12 flex items-center justify-center sm:justify-start sm:px-4 rounded-xl transition-all ${
                activeTab === item.id 
                  ? `bg-${item.color}-600 text-white shadow-lg` 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="hidden sm:inline ml-3 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {statusMsg && (
          <div className="p-2 m-2 mb-4 bg-blue-600/20 border border-blue-600/40 rounded-xl text-[8px] font-black text-blue-400 text-center animate-pulse">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* DISPLAY TAB */}
          {activeTab === 'display' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <header className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Monitor className="text-blue-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Pantalla</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Personaliza tu experiencia visual</p>
                </div>
              </header>
              
              {/* Brightness */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <Sun size={18} className="text-yellow-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Brillo</h3>
                </div>
                <Slider 
                  value={br} 
                  onChange={v => { 
                    setBr(v); 
                    saveConfig('user.display.brightness', v);
                    window.dispatchEvent(new CustomEvent('sys-brightness-change', { detail: v }));
                  }} 
                  label="Nivel de luminosidad" 
                />
              </div>

              {/* Wallpapers */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <Palette size={18} className="text-purple-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fondo de pantalla</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {WALLPAPERS.map(item => (
                    <button 
                      key={item.name} 
                      onClick={() => { 
                        setWp(item.url); 
                        saveConfig('user.desktop.wallpaper', item.url);
                        window.dispatchEvent(new CustomEvent('sys-wallpaper-change', { detail: item.url }));
                      }} 
                      className={`relative aspect-video rounded-2xl overflow-hidden border-2 transition-all group ${
                        wp === item.url ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={item.url} className="w-full h-full object-cover" />
                      {wp === item.url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <CheckCircle size={24} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SOUND TAB */}
          {activeTab === 'sound' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <header className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Speaker className="text-purple-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Sonido</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Efectos de sonido y vibración</p>
                </div>
              </header>

              {/* Master Volume */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {soundSettings.enabled ? <Volume2 size={18} className="text-blue-500" /> : <VolumeX size={18} className="text-gray-500" />}
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Volumen maestro</h3>
                  </div>
                  <Toggle enabled={soundSettings.enabled} onToggle={() => saveSoundSettings({ enabled: !soundSettings.enabled })} />
                </div>
                
                {soundSettings.enabled && (
                  <Slider 
                    value={soundSettings.volume} 
                    onChange={v => saveSoundSettings({ volume: v })} 
                    label="Nivel de volumen" 
                  />
                )}
              </div>

              {/* Sound Settings */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Preferencias</h3>
                
                <SettingItem
                  icon={<Bell size={18} />}
                  title="Sonidos de notificación"
                  description="Reproducir sonido al recibir notificaciones"
                  action={<Toggle enabled={soundSettings.notifications} onToggle={() => saveSoundSettings({ notifications: !soundSettings.notifications })} />}
                />
                
                <SettingItem
                  icon={<Vibrate size={18} />}
                  title="Retroalimentación háptica"
                  description="Vibración al tocar elementos"
                  action={<Toggle enabled={soundSettings.haptic} onToggle={() => saveSoundSettings({ haptic: !soundSettings.haptic })} />}
                />
              </div>

              {/* Test Sounds */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Probar sonidos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { type: 'notification' as const, label: 'Notificación', color: 'blue' },
                    { type: 'success' as const, label: 'Éxito', color: 'green' },
                    { type: 'warning' as const, label: 'Advertencia', color: 'yellow' },
                    { type: 'error' as const, label: 'Error', color: 'red' }
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => testSound(item.type)}
                      className={`p-4 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/30 text-${item.color}-400 hover:bg-${item.color}-500/20 transition-all active:scale-95`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <header className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${hasPin ? 'bg-emerald-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                  <Lock className={hasPin ? 'text-emerald-400' : 'text-red-400'} size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Seguridad</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Protección y cifrado</p>
                </div>
                {hasPin && (
                  <div className="ml-auto px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                    <span className="text-[8px] font-black text-emerald-400 uppercase">Activo</span>
                  </div>
                )}
              </header>

              {/* PIN Config */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${hasPin ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                    {hasPin ? <Fingerprint size={24}/> : <ShieldAlert size={24}/>}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black uppercase text-white tracking-wider">PIN Maestro</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Acceso al sistema</p>
                  </div>
                  {hasPin && (
                    <button onClick={clearSecurity} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <input 
                    type="password" 
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-2xl font-mono tracking-[0.8em] text-center focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                  />
                  <button 
                    onClick={handleSetPin} 
                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] ${
                      hasPin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    } text-white shadow-lg`}
                  >
                    {hasPin ? 'Actualizar PIN' : 'Activar Seguridad'}
                  </button>
                </div>
              </div>

              {/* Export Key */}
              {hasPin && (
                <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <Key size={20} className="text-emerald-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Exportar llave de recuperación</h3>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Genera un archivo .sharkkey que te permite acceder al sistema sin ingresar el PIN. 
                    Guárdalo en un lugar seguro.
                  </p>
                  <button 
                    onClick={downloadApexKey} 
                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-xl"
                  >
                    <Download size={14}/> Exportar SharkKey
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <header className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <Cpu className="text-orange-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Sistema</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Información del dispositivo</p>
                </div>
              </header>

              {/* Device Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-center space-y-2">
                  <Smartphone size={24} className="text-gray-500 mx-auto"/>
                  <span className="text-[8px] font-black text-gray-600 uppercase block">Modelo</span>
                  <span className="text-xs font-bold text-gray-300">SHARK_OS_PRO</span>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-center space-y-2">
                  <Zap size={24} className="text-yellow-500 mx-auto"/>
                  <span className="text-[8px] font-black text-gray-600 uppercase block">Versión</span>
                  <span className="text-xs font-bold text-emerald-500">APEX v15.13</span>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-center space-y-2">
                  <Database size={24} className="text-blue-500 mx-auto"/>
                  <span className="text-[8px] font-black text-gray-600 uppercase block">Memoria</span>
                  <span className="text-xs font-bold text-gray-300">4GB Virtual</span>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-center space-y-2">
                  <HardDrive size={24} className="text-purple-500 mx-auto"/>
                  <span className="text-[8px] font-black text-gray-600 uppercase block">Almacenamiento</span>
                  <span className="text-xs font-bold text-gray-300">OPFS + IDB</span>
                </div>
              </div>

              {/* Kernel Info */}
              <div className="bg-black/40 border border-white/5 p-5 rounded-2xl text-[10px] font-mono text-gray-500 leading-relaxed">
                <div className="text-blue-500 font-bold mb-2">KERNEL_STATUS</div>
                UPTIME: {Math.floor((Date.now() - kernel.bootTime) / 1000)}s<br/>
                MEMORY: 4096MB_VIRTUAL<br/>
                PROCESSES: {kernel.processes?.length || 0}<br/>
                STATE: STABLE
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <header className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <Info className="text-cyan-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Acerca de</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Shark OS</p>
                </div>
              </header>

              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-3xl border border-white/10 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  <span className="text-3xl">🦈</span>
                </div>
                <h3 className="text-2xl font-black text-white">Shark OS</h3>
                <p className="text-gray-400 text-sm">Sistema operativo web de próxima generación</p>
                <div className="flex justify-center gap-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-gray-400">v15.13</span>
                  <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400">STABLE</span>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Créditos</h4>
                <div className="text-[11px] text-gray-400 space-y-2">
                  <p>Desarrollado con ❤️ usando React, TypeScript y Next.js</p>
                  <p>Web Audio API para sonido procedural</p>
                  <p>IndexedDB & OPFS para almacenamiento</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
