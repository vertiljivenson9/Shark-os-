import React, { useState, useEffect, useRef } from 'react';
import { kernel } from '../services/kernel';
import { Shell } from '../services/terminal/sh';
import { Settings, X, Send, AlertCircle } from 'lucide-react';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
}

const THEMES: Record<string, { text: string, bg: string, prompt: string }> = {
    green: { text: 'text-green-500 text-shadow-green', bg: 'bg-[#051105]', prompt: 'text-green-400' },
    amber: { text: 'text-amber-500 text-shadow-amber', bg: 'bg-[#110d05]', prompt: 'text-amber-400' },
    white: { text: 'text-gray-300', bg: 'bg-[#1e1e1e]', prompt: 'text-blue-400' },
    cyber: { text: 'text-cyan-400 text-shadow-cyan', bg: 'bg-[#0a0a12]', prompt: 'text-pink-500' },
};

export const TerminalApp: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', content: 'WebOS Kernel v3.1.0-stable' },
    { type: 'info', content: 'Copyright (c) 2024 Viscrosoft Corp.' },
    { type: 'output', content: '\nWelcome back, root. System is ready.' },
    { type: 'output', content: 'Type "help" for a list of commands or "man <cmd>" for manual.\n' },
  ]);
  const [input, setInput] = useState('');
  const [shell] = useState(() => new Shell());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [cwd, setCwd] = useState('/user/home');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempHistory, setTempHistory] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState('green');
  const [matrixMode, setMatrixMode] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, matrixMode]);

  // Focus keeper
  useEffect(() => {
    const keepFocus = () => !matrixMode && inputRef.current?.focus();
    window.addEventListener('click', keepFocus);
    return () => window.removeEventListener('click', keepFocus);
  }, [matrixMode]);

  const execute = async (cmdStr: string) => {
    const cleanCmd = cmdStr.trim();
    if (!cleanCmd) return;

    // Special UI Commands Interception
    if (cleanCmd === 'clear') {
        setLines([]);
        return;
    }
    if (cleanCmd === 'matrix') {
        setMatrixMode(true);
        return;
    }
    if (cleanCmd.startsWith('theme ')) {
        const t = cleanCmd.split(' ')[1];
        if (THEMES[t]) {
            setCurrentTheme(t);
            setLines(prev => [...prev, { type: 'input', content: `${cwd} # ${cmdStr}` }, { type: 'info', content: `Theme changed to ${t}` }]);
            return;
        }
    }

    // Standard Shell Execution
    setLines(prev => [...prev, { type: 'input', content: `${cwd} # ${cmdStr}` }]);
    
    try {
        await shell.exec(
            cmdStr, 
            (text) => setLines(prev => [...prev, { type: 'output', content: text }]),
            (newPath) => setCwd(newPath),
            () => cwd
        );
    } catch (e: any) {
        setLines(prev => [...prev, { type: 'error', content: e.message }]);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      execute(input);
      setTempHistory(prev => [...prev, input]);
      setHistoryIndex(-1);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleSend();
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (tempHistory.length > 0) {
              const newIdx = historyIndex === -1 ? tempHistory.length - 1 : Math.max(0, historyIndex - 1);
              setHistoryIndex(newIdx);
              setInput(tempHistory[newIdx]);
          }
      } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex !== -1) {
              const newIdx = Math.min(tempHistory.length - 1, historyIndex + 1);
              setHistoryIndex(newIdx);
              setInput(tempHistory[newIdx]);
              if (newIdx === tempHistory.length - 1 && historyIndex === tempHistory.length - 1) {
                  setHistoryIndex(-1);
                  setInput('');
              }
          } else {
              setInput('');
          }
      } else if (e.key === 'c' && e.ctrlKey) {
          setLines(prev => [...prev, { type: 'input', content: `${cwd} # ${input}^C` }]);
          setInput('');
      }
  };

  if (matrixMode) {
      return <MatrixEffect onExit={() => setMatrixMode(false)} />;
  }

  const theme = THEMES[currentTheme];

  return (
    <div className={`relative h-full w-full flex flex-col font-mono text-sm overflow-hidden ${theme.bg} ${theme.text}`}>
      
      {/* CRT Scanline Effect Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
      
      {/* Terminal Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 z-0 no-scrollbar pb-10">
        {lines.map((line, i) => (
          <div key={i} className={`mb-0.5 whitespace-pre-wrap break-words leading-tight flex items-start gap-2 ${line.type === 'error' ? 'text-red-500 bg-red-500/10 p-1 rounded border border-red-500/20' : line.type === 'input' ? 'font-bold opacity-90' : line.type === 'info' ? 'opacity-60' : 'opacity-80'}`}>
             {line.type === 'error' && <AlertCircle size={14} className="mt-0.5 shrink-0" />}
             <div className="flex-1">
                {line.type === 'input' ? '' : line.content}
                {line.type === 'input' && (
                    <span>
                        <span className={theme.prompt}>{line.content.split('#')[0]}#</span>
                        <span>{line.content.split('#')[1]}</span>
                    </span>
                )}
             </div>
          </div>
        ))}
        
        {/* Input Line */}
        <div className="flex items-center mt-2 group gap-2">
          <div className="flex items-center flex-1">
            <span className={`mr-2 font-bold ${theme.prompt} select-none whitespace-nowrap`}>{cwd} #</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`flex-1 bg-transparent border-none outline-none font-bold ${theme.text}`}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {/* Blinking Cursor Block */}
            <span className={`w-2.5 h-5 ${currentTheme === 'white' ? 'bg-gray-500' : 'bg-current'} animate-pulse -ml-1`}></span>
          </div>
          
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-2 rounded-lg transition-all active:scale-90 ${input.trim() ? 'bg-current opacity-20 hover:opacity-40' : 'opacity-10 cursor-not-allowed'}`}
            title="Execute Command"
          >
            <Send size={16} className={theme.text} />
          </button>
        </div>
        <div ref={bottomRef} />
      </div>

      <style>{`
        .text-shadow-green { text-shadow: 0 0 5px rgba(34, 197, 94, 0.5); }
        .text-shadow-amber { text-shadow: 0 0 5px rgba(245, 158, 11, 0.5); }
        .text-shadow-cyan { text-shadow: 0 0 5px rgba(34, 211, 238, 0.5); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

// --- Matrix Effect Component ---
const MatrixEffect: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for(let x = 0; x < columns; x++) drops[x] = 1;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            for(let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 33);
        const handleResize = () => {
             canvas.width = window.innerWidth;
             canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Exit on any key
        const handleKey = () => onExit();
        window.addEventListener('keydown', handleKey);
        window.addEventListener('click', handleKey);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('click', handleKey);
        };
    }, [onExit]);

    return (
        <div className="absolute inset-0 bg-black overflow-hidden cursor-pointer z-50">
            <canvas ref={canvasRef} className="block" />
            <div className="absolute top-4 right-4 text-green-500 font-mono text-xs animate-pulse">
                Press any key to exit Matrix...
            </div>
        </div>
    );
}