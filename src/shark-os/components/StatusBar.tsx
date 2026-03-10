
import React, { useState, useEffect } from 'react';
import { Battery, Wifi, Volume2, Mic } from 'lucide-react';
import { kernel } from '../services/kernel';

export const StatusBar: React.FC<{ onToggleControlCenter?: () => void }> = ({ onToggleControlCenter }) => {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(100);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((b: any) => {
        setBattery(b.level * 100); setIsCharging(b.charging);
        b.addEventListener('levelchange', () => setBattery(b.level * 100));
        b.addEventListener('chargingchange', () => setIsCharging(b.charging));
      });
    }
    return () => clearInterval(timer);
  }, []);

  return (
    <div onClick={onToggleControlCenter} className="h-6 bg-black/40 backdrop-blur-md text-white flex items-center justify-between px-4 text-[10px] select-none z-[9000] fixed top-0 w-full font-black tracking-widest cursor-pointer hover:bg-black/60 transition-colors uppercase">
      <div className="flex items-center gap-4">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        <span className="opacity-40 hidden sm:block">{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="flex items-center gap-3">
        <Mic size={10} className="text-red-500 animate-pulse" />
        <Wifi size={12} />
        <div className="flex items-center gap-1">
          <span>{Math.round(battery)}%</span>
          <Battery size={14} className={isCharging ? 'text-green-400' : ''} />
        </div>
      </div>
    </div>
  );
};
