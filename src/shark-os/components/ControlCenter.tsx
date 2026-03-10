import React, { useState, useEffect } from 'react';
import { Wifi, Bluetooth, Plane, Moon, Sun, Volume2, Flashlight, Bell, X, Music, RotateCcw } from 'lucide-react';
import { kernel } from '../services/kernel';
import { Notification } from '../types';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export const ControlCenter: React.FC<ControlCenterProps> = ({ isOpen, onClose, notifications }) => {
  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(true);
  const [airplane, setAirplane] = useState(false);
  const [dnd, setDnd] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(80);
  const [flashlight, setFlashlight] = useState(false);

  useEffect(() => {
    // Load initial system states
    const load = async () => {
        const br = await kernel.registry.get('user.display.brightness');
        if (br !== undefined) setBrightness(br);
        
        const vol = await kernel.registry.get('system.audio.volume');
        if (vol !== undefined) setVolume(vol * 100);
    };
    if (isOpen) load();
  }, [isOpen]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => setter(!val);

  const handleBrightness = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setBrightness(val);
      kernel.registry.set('user.display.brightness', val);
      // Dispatch event for App.tsx to pick up
      window.dispatchEvent(new CustomEvent('sys-config-update'));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setVolume(val);
      kernel.audio.setMasterVolume(val / 100);
      kernel.registry.set('system.audio.volume', val / 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute top-2 right-2 bottom-2 w-80 md:w-96 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-4 flex flex-col text-white overflow-hidden animate-in slide-in-from-right-10 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pl-2">
            <h2 className="text-lg font-bold">Control Center</h2>
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                <X size={16} />
            </button>
        </div>

        {/* Connectivity Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/10 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                    <ToggleBtn icon={Wifi} active={wifi} onClick={() => setWifi(!wifi)} color="bg-blue-500" />
                    <ToggleBtn icon={Bluetooth} active={bt} onClick={() => setBt(!bt)} color="bg-blue-500" />
                </div>
                <div className="flex gap-2">
                    <ToggleBtn icon={Plane} active={airplane} onClick={() => setAirplane(!airplane)} color="bg-orange-500" />
                    <ToggleBtn icon={Moon} active={dnd} onClick={() => setDnd(!dnd)} color="bg-purple-500" />
                </div>
            </div>

            {/* Media Mockup */}
            <div className="bg-white/10 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                 <div className="relative z-10 flex items-center gap-2 text-xs text-gray-300">
                     <Music size={14} />
                     <span>Now Playing</span>
                 </div>
                 <div className="relative z-10">
                     <div className="text-sm font-bold truncate">Not Playing</div>
                     <div className="text-xs text-gray-400">Music App</div>
                 </div>
                 <div className="flex justify-center gap-2 mt-2 relative z-10">
                     <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
                         <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5" />
                     </div>
                 </div>
            </div>
        </div>

        {/* Sliders */}
        <div className="bg-white/10 rounded-2xl p-4 space-y-4 mb-6">
            <div className="flex items-center gap-3">
                <Sun size={20} className="text-gray-300" />
                <input 
                    type="range" min="10" max="100" 
                    value={brightness} onChange={handleBrightness}
                    className="flex-1 h-12 rounded-full appearance-none bg-black/40 overflow-hidden relative [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0"
                    style={{ background: `linear-gradient(to right, white ${brightness}%, rgba(0,0,0,0.5) ${brightness}%)` }}
                />
            </div>
            <div className="flex items-center gap-3">
                <Volume2 size={20} className="text-gray-300" />
                <input 
                    type="range" min="0" max="100" 
                    value={volume} onChange={handleVolume}
                    className="flex-1 h-12 rounded-full appearance-none bg-black/40 overflow-hidden relative [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0"
                    style={{ background: `linear-gradient(to right, white ${volume}%, rgba(0,0,0,0.5) ${volume}%)` }}
                />
            </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-6">
             <QuickAction icon={Flashlight} active={flashlight} onClick={() => setFlashlight(!flashlight)} label="Flash" />
             <QuickAction icon={RotateCcw} active={false} onClick={() => {}} label="Rotate" />
             {/* Add more placeholders if needed */}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <Bell size={12} />
                <span>Notifications</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {notifications.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs py-4">No recent notifications</div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-gray-200">{n.title}</span>
                                <span className="text-[10px] text-gray-500">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-tight">{n.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

const ToggleBtn = ({ icon: Icon, active, onClick, color }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 aspect-square rounded-full flex items-center justify-center transition-all ${active ? color + ' text-white shadow-lg shadow-blue-900/50' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
    >
        <Icon size={20} />
    </button>
);

const QuickAction = ({ icon: Icon, active, onClick, label }: any) => (
    <div className="flex flex-col items-center gap-1">
        <button 
            onClick={onClick}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
            <Icon size={24} />
        </button>
        <span className="text-[10px] text-gray-400">{label}</span>
    </div>
);
