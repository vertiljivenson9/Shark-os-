
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Timer, Watch, Play, Pause, RefreshCw } from 'lucide-react';

export const ClockApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clock' | 'stopwatch' | 'timer'>('clock');
  return (
    <div className="h-full bg-gray-950 text-white flex flex-col font-sans">
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'clock' && <WorldClock />}
        {activeTab === 'stopwatch' && <Stopwatch />}
        {activeTab === 'timer' && <TimerTab />}
      </div>
      <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-around pb-2">
        <TabButton id="clock" icon={Clock} label="Reloj" active={activeTab} set={setActiveTab} />
        <TabButton id="stopwatch" icon={Watch} label="Cronómetro" active={activeTab} set={setActiveTab} />
        <TabButton id="timer" icon={Timer} label="Cuenta atrás" active={activeTab} set={setActiveTab} />
      </div>
    </div>
  );
};

const TabButton = ({ id, icon: Icon, label, active, set }: any) => (
  <button onClick={() => set(id)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${active === id ? 'text-orange-500' : 'text-gray-500'}`}>
    <Icon size={20} className="mb-1" /><span className="text-[10px] font-medium">{label}</span>
  </button>
);

const WorldClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="h-full p-6 flex flex-col">
      <h2 className="text-3xl font-bold mb-6">Reloj Mundial</h2>
      <div className="flex items-baseline justify-between py-4 border-b border-gray-800">
        <div><div className="text-sm text-gray-400">Local</div><div className="text-xl font-medium">Madrid / París</div></div>
        <div className="text-5xl font-light tabular-nums">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
      </div>
    </div>
  );
};

const Stopwatch = () => {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const update = () => { setTime(Date.now() - startTimeRef.current); rafRef.current = requestAnimationFrame(update); };
  const toggle = () => { if (running) { setRunning(false); cancelAnimationFrame(rafRef.current); } else { setRunning(true); startTimeRef.current = Date.now() - time; update(); } };
  const reset = () => { setRunning(false); cancelAnimationFrame(rafRef.current); setTime(0); };
  const format = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return <div className="flex items-baseline gap-1 tabular-nums font-mono"><span className="text-6xl">{m.toString().padStart(2, '0')}</span><span className="text-6xl text-gray-600">:</span><span className="text-6xl">{s.toString().padStart(2, '0')}</span><span className="text-3xl text-orange-500">.{cs.toString().padStart(2, '0')}</span></div>;
  };
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="flex-1 flex items-center justify-center">{format(time)}</div>
      <div className="flex gap-8 mb-8">
        <button onClick={reset} className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white"><RefreshCw size={20} /></button>
        <button onClick={toggle} className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${running ? 'bg-red-900/50' : 'bg-green-900/50'}`}>{running ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button>
      </div>
    </div>
  );
};

const TimerTab = () => {
  const [timeLeft, setTimeLeft] = useState(300);
  const [running, setRunning] = useState(false);
  useEffect(() => { let interval: number; if (running && timeLeft > 0) interval = window.setInterval(() => setTimeLeft(t => t - 1), 1000); return () => clearInterval(interval); }, [running, timeLeft]);
  const format = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="text-6xl font-mono mb-12">{format(timeLeft)}</div>
      <div className="flex gap-8 mb-8">
        <button onClick={() => { setRunning(false); setTimeLeft(300); }} className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white"><RefreshCw size={20} /></button>
        <button onClick={() => setRunning(!running)} className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${running ? 'bg-orange-900/50' : 'bg-green-900/50'}`}>{running ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button>
      </div>
    </div>
  );
};
