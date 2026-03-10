
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Key, FileDigit, Zap, AlertCircle, UploadCloud } from 'lucide-react';
import { kernel } from '../services/kernel';

interface LockScreenProps {
  onUnlock: () => void;
  wallpaper?: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, wallpaper }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [time, setTime] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePinSubmit = async (val: string) => {
    const storedPin = await kernel.registry.get('system.security.pin');
    if (val === storedPin) {
        onUnlock();
    } else {
        setError(true);
        setPin('');
        setTimeout(() => setError(false), 1000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target?.result as string);
            const storedPin = await kernel.registry.get('system.security.pin');
            
            // Verificación del archivo propietario ApexKey
            if (data.header === "APEX_OS_SECURITY_TOKEN_v1" && atob(data.payload).includes(`pin:${storedPin}`)) {
                onUnlock();
            } else {
                throw new Error("Invalid Auth Token");
            }
        } catch (err) {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div 
        className="fixed inset-0 z-[10000] bg-black text-white flex flex-col items-center justify-center select-none overflow-hidden font-sans"
        style={{ backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
      
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full p-8 text-center animate-in zoom-in duration-500">
        {!showPinInput ? (
            <div className="space-y-12">
                <div className="space-y-2">
                    <h1 className="text-8xl font-thin tracking-tighter tabular-nums drop-shadow-2xl">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </h1>
                    <p className="text-xs font-black tracking-[0.6em] opacity-60 uppercase ml-2">
                        {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <button onClick={() => setShowPinInput(true)} className="px-12 py-5 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3">
                        <Key size={16}/> Acceder con PIN
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="px-12 py-5 bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                        <UploadCloud size={16}/> Insertar ApexKey
                    </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".apexkey" className="hidden" />
            </div>
        ) : (
            <div className="w-full space-y-8 animate-in slide-in-from-bottom-10">
                <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 transition-all duration-300 ${error ? 'bg-red-500 animate-shake shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-white/10 border border-white/20 shadow-xl'}`}>
                    {error ? <AlertCircle /> : <Lock size={24} />}
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.4em]">PIN de Acceso</h2>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Introduce el código maestro</p>
                </div>

                <div className="flex justify-center gap-4">
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-blue-500 border-blue-500 scale-125 shadow-[0_0_15px_#3b82f6]' : 'border-white/10'}`} />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                    {[1,2,3,4,5,6,7,8,9].map(num => (
                        <button key={num} onClick={() => pin.length < 6 && setPin(p => p + num)} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl font-bold hover:bg-white/10 active:scale-90 transition-all">{num}</button>
                    ))}
                    <button onClick={() => setPin('')} className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-tighter">CLR</button>
                    <button onClick={() => pin.length < 6 && setPin(p => p + '0')} className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-bold">0</button>
                    <button onClick={() => handlePinSubmit(pin)} className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-tighter">OK</button>
                </div>

                <button onClick={() => { setShowPinInput(false); setPin(''); }} className="mt-8 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Volver a inicio</button>
            </div>
        )}
      </div>

      <div className="absolute bottom-10 left-0 right-0 text-center animate-pulse">
         <div className="flex items-center justify-center gap-3 text-gray-600 text-[8px] font-black uppercase tracking-[0.8em]">
            <Zap size={12} className="text-blue-500 fill-blue-500"/> Shark OS APEX UNIFIED
         </div>
      </div>

      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
