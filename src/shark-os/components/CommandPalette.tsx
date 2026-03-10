import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Command } from 'lucide-react';
import { AppDefinition } from '../types';

interface CommandPaletteProps {
  apps: AppDefinition[];
  onLaunch: (app: AppDefinition) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ apps, onLaunch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle with Ctrl+Space or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.code === 'Space') || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
        setQuery('');
        setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(query.toLowerCase()) || 
    app.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit to 5 results

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredApps.length - 1));
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredApps[selectedIndex]) {
              onLaunch(filteredApps[selectedIndex]);
              setIsOpen(false);
          }
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur-[2px] flex items-start justify-center pt-[20vh]" onClick={() => setIsOpen(false)}>
      <div 
        className="w-[500px] max-w-[90vw] bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-white/10">
            <Search className="text-gray-400 mr-3" size={20} />
            <input 
                ref={inputRef}
                className="flex-1 bg-transparent text-xl text-white outline-none placeholder-gray-500 font-light"
                placeholder="Type to search..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
            />
            <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded font-mono border border-white/5">
                <span className="text-xs">ESC</span>
            </div>
        </div>

        {filteredApps.length > 0 ? (
            <div className="py-2">
                {filteredApps.map((app, i) => (
                    <button
                        key={app.id}
                        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${i === selectedIndex ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                        onClick={() => { onLaunch(app); setIsOpen(false); }}
                        onMouseEnter={() => setSelectedIndex(i)}
                    >
                        <div className="flex items-center gap-3">
                            {/* Assuming App.tsx logic for icons is unavailable here, strictly using text/name fallback or generic logic */}
                            {/* Since we don't have the icon map here easily, we use a generic box or nothing */}
                            <Command size={16} className={i === selectedIndex ? 'text-white' : 'text-gray-500'} />
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-bold">{app.name}</span>
                                <span className={`text-[10px] ${i === selectedIndex ? 'text-blue-200' : 'text-gray-500'}`}>{app.component}</span>
                            </div>
                        </div>
                        {i === selectedIndex && <ArrowRight size={16} />}
                    </button>
                ))}
            </div>
        ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
                No apps found for "{query}"
            </div>
        )}
        
        <div className="bg-[#111] px-4 py-1.5 text-[10px] text-gray-600 flex justify-between">
            <span>WebOS Finder</span>
            <div className="flex gap-2">
                <span>Select ↵</span>
                <span>Navigate ↑↓</span>
            </div>
        </div>
      </div>
    </div>
  );
};