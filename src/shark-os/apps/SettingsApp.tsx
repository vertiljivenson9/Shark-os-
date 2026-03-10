
import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { 
  Monitor, Lock, Cpu, Palette, Key, Download, Save, CheckCircle, Smartphone, ShieldCheck, Zap, Trash2, ShieldAlert, Fingerprint, Activity, Shield
} from 'lucide-react';

const WALLPAPERS = [
  { name: 'Shark Apex', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564' },
  { name: 'Neon City', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=2000' },
  { name: 'Abyssal Blue', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000' },
  { name: 'Cyber Grid', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000' }
];

export const SettingsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'display' | 'security' | 'system'>('display');
  const [pin, setPin] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [br, setBr] = useState(100);
  const [wp, setWp] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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
    };
    load();
  }, []);

  const saveConfig = async (key: string, val: any) => {
    await kernel.registry.set(key, val);
    if (kernel.registry.flush) await kernel.registry.flush();
    window.dispatchEvent(new CustomEvent('sys-config-update'));
    showStatus("DNA_SYNC_OK");
  };

  const handleSetPin = async () => {
    if (pin.length < 4) {
      alert("Seguridad insuficiente: El PIN debe tener al menos 4 caracteres.");
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
        header: "APEX_OS_SECURITY_TOKEN_v1",
        version: "15.1",
        created: new Date().toISOString(),
        identity: "MASTER_ID_00",
        payload: btoa(`pin:${pin}:${Date.now()}`)
    };
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/apex-key' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SharkMaster.apexkey`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus("LLAVE_EXPORTADA");
  };

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all active:scale-95 ${activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
    >
        <Icon size={18} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  return (
    <div className="h-full flex bg-[#020202] text-gray-200 font-sans select-none overflow-hidden">
      {/* Sidebar - Optimizado para pulgares en móvil */}
      <div className="w-16 sm:w-56 border-r border-white/5 bg-black flex flex-col shrink-0">
        <div className="py-6 flex justify-center border-b border-white/5">
            <h1 className="hidden sm:flex text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] items-center gap-2">
                <ShieldCheck size={12}/> AJUSTES_SISTEMA
            </h1>
            <ShieldCheck size={20} className="sm:hidden text-blue-500" />
        </div>
        <nav className="flex-1 p-2 space-y-2">
            <button onClick={() => setActiveTab('display')} className={`w-full aspect-square sm:aspect-auto sm:h-12 flex items-center justify-center sm:justify-start sm:px-4 rounded-xl transition-all ${activeTab === 'display' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                <Monitor size={20} /><span className="hidden sm:inline ml-3 text-[10px] font-black uppercase tracking-widest">Pantalla</span>
            </button>
            <button onClick={() => setActiveTab('security')} className={`w-full aspect-square sm:aspect-auto sm:h-12 flex items-center justify-center sm:justify-start sm:px-4 rounded-xl transition-all ${activeTab === 'security' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>
                <Lock size={20} /><span className="hidden sm:inline ml-3 text-[10px] font-black uppercase tracking-widest">Seguridad</span>
            </button>
            <button onClick={() => setActiveTab('system')} className={`w-full aspect-square sm:aspect-auto sm:h-12 flex items-center justify-center sm:justify-start sm:px-4 rounded-xl transition-all ${activeTab === 'system' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>
                <Cpu size={20} /><span className="hidden sm:inline ml-3 text-[10px] font-black uppercase tracking-widest">Núcleo</span>
            </button>
        </nav>
        {statusMsg && (
            <div className="p-2 mb-4 bg-blue-600/20 border-y border-blue-600/40 rounded-lg text-[8px] font-black text-blue-400 text-center animate-pulse">
                {statusMsg}
            </div>
        )}
      </div>

      {/* Área de Contenido Principal */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-12 no-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05)_0%,transparent_50%)]">
        <div className="max-w-xl mx-auto">
            {activeTab === 'display' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <header className="flex items-center gap-4">
                        <Monitor className="text-blue-500" size={24} />
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Entorno Visual</h2>
                    </header>
                    
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-4">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Fondo de Escritorio</p>
                        <div className="grid grid-cols-2 gap-3">
                            {WALLPAPERS.map(item => (
                                <button key={item.name} onClick={() => { setWp(item.url); saveConfig('user.desktop.wallpaper', item.url); }} className={`relative aspect-video rounded-2xl overflow-hidden border-2 transition-all ${wp === item.url ? 'border-blue-500 scale-[1.02]' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                                    <img src={item.url} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Luminosidad</span>
                            <span className="text-blue-500 font-mono font-bold text-xs">{br}%</span>
                        </div>
                        <input type="range" min="10" max="100" value={br} onChange={e => { setBr(Number(e.target.value)); saveConfig('user.display.brightness', Number(e.target.value)); }} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <header className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Lock className={hasPin ? 'text-emerald-500' : 'text-red-500'} size={24} />
                            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Criptografía</h2>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <Activity size={10} className="text-blue-500 animate-pulse"/>
                            <span className="text-[8px] font-black text-blue-400 uppercase">AES-256</span>
                        </div>
                    </header>

                    {/* BLOQUE DE PIN */}
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${hasPin ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {hasPin ? <Fingerprint size={24}/> : <ShieldAlert size={24}/>}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest">PIN Maestro</h3>
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Acceso biométrico virtual</p>
                            </div>
                            {hasPin && (
                                <button onClick={clearSecurity} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16}/></button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <input 
                                type="password" 
                                maxLength={6}
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="----"
                                className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-2xl font-mono tracking-[0.8em] text-center focus:border-blue-500 outline-none transition-all placeholder:text-gray-800"
                            />
                            <button onClick={handleSetPin} className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${hasPin ? 'bg-blue-600' : 'bg-emerald-600'} text-white shadow-lg shadow-black/50`}>
                                {hasPin ? 'Actualizar PIN' : 'Activar Cifrado de Disco'}
                            </button>
                        </div>
                    </div>

                    {/* BLOQUE DE LLAVE - DINÁMICO */}
                    <div className={`transition-all duration-500 ${hasPin ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-4 pointer-events-none'}`}>
                        <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 space-y-4 text-center">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full mx-auto flex items-center justify-center text-emerald-500">
                                <Key size={20} />
                            </div>
                            <h3 className="text-white font-black uppercase tracking-widest text-xs">Generador ApexKey</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed max-w-[280px] mx-auto">
                                Crea una llave física (.apexkey) para saltar el PIN en este dispositivo.
                            </p>
                            
                            <button onClick={downloadApexKey} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl">
                                <Download size={14}/> Exportar MasterKey
                            </button>
                            <div className="pt-2">
                                <span className="text-[7px] font-mono text-emerald-500/40 uppercase">ID_SESS_{Math.random().toString(36).substr(2,9).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <header className="flex items-center gap-4">
                        <Cpu className="text-purple-500" size={24}/>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Hardware Virtual</h2>
                    </header>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center space-y-2">
                            <Smartphone size={24} className="text-gray-500 mx-auto"/>
                            <span className="text-[8px] font-black text-gray-600 uppercase block">Modelo</span>
                            <span className="text-xs font-bold text-gray-300">SHARK_MOBILE_PRO</span>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center space-y-2">
                            <Zap size={24} className="text-yellow-500 mx-auto"/>
                            <span className="text-[8px] font-black text-gray-600 uppercase block">Arquitectura</span>
                            <span className="text-xs font-bold text-emerald-500">APEX_v15.1</span>
                        </div>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-[8px] font-mono text-gray-500 leading-relaxed">
                        KERNEL_UPTIME: {Math.floor((Date.now() - kernel.bootTime)/1000)}s<br/>
                        MEMORY_MAP: 4096MB_VIRTUAL<br/>
                        CPU_STATE: STABLE_DNA_MASTER
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
