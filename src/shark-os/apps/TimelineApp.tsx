
import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { HistoryEvent } from '../services/system/history';
import { PROJECT_SOURCE } from '../data/project_source';
import { History, Cpu, Binary, Zap, Code, ShieldCheck, Clock, Archive } from 'lucide-react';

export const TimelineApp: React.FC = () => {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'source'>('events');

  useEffect(() => {
    return kernel.history.subscribe(setEvents);
  }, []);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getTypeIcon = (type: HistoryEvent['type']) => {
    switch(type) {
      case 'kernel': return <Cpu size={14} className="text-blue-400" />;
      case 'app': return <Zap size={14} className="text-yellow-400" />;
      case 'dna': return <Binary size={14} className="text-purple-400" />;
      case 'fs': return <Archive size={14} className="text-green-400" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] text-gray-300 font-sans">
      {/* Header */}
      <div className="h-12 bg-black/40 border-b border-white/5 flex items-center px-6 gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <History size={18} className="text-blue-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Nexus Timeline</span>
        </div>
        <nav className="flex gap-4">
          <button 
            onClick={() => setActiveTab('events')}
            className={`text-[10px] font-bold uppercase transition-colors ${activeTab === 'events' ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
          >
            System Events
          </button>
          <button 
            onClick={() => setActiveTab('source')}
            className={`text-[10px] font-bold uppercase transition-colors ${activeTab === 'source' ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}
          >
            Project DNA
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.05)_0%,transparent_50%)] pointer-events-none" />

        {activeTab === 'events' ? (
          <div className="h-full overflow-y-auto p-6 space-y-4 no-scrollbar">
            {events.map((event, i) => (
              <div key={event.id} className="flex gap-4 group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-blue-500/50 transition-colors">
                    {getTypeIcon(event.type)}
                  </div>
                  {i < events.length - 1 && <div className="w-px h-full bg-white/10 my-2" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-400 font-mono">[{formatTime(event.timestamp)}]</span>
                    <span className="text-[10px] uppercase font-black tracking-widest">{event.type}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{event.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6 space-y-2 no-scrollbar font-mono text-[10px]">
            {Object.entries(PROJECT_SOURCE).map(([path, content]) => (
              <div key={path} className="p-3 bg-white/5 rounded border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-3 truncate">
                  <Code size={12} className="text-blue-500" />
                  <span className="text-gray-400 truncate">{path}</span>
                </div>
                <span className="text-gray-600 group-hover:text-blue-400 transition-colors">{content.length} bytes</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
