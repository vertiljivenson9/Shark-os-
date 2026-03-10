
import React from 'react';
import { WindowState } from '../types';
import { X, Minus, Square, Maximize2 } from 'lucide-react';

interface WindowProps {
  state: WindowState;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onUpdate: (id: string, newState: Partial<WindowState>) => void;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ state, onClose, onMinimize, onMaximize, onFocus, onUpdate, children }) => {
  const isMobile = window.innerWidth < 768;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(state.id);
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMinimize(state.id);
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMaximize(state.id);
  };

  const getStyle = (): React.CSSProperties => {
      if (state.isMaximized) {
          return {
              left: '2vw',
              top: isMobile ? '40px' : '4vh',
              width: '96vw',
              height: isMobile ? 'calc(100vh - 100px)' : '90vh',
              zIndex: state.zIndex,
          };
      }
      
      return {
          left: typeof state.x === 'number' ? `${state.x}px` : state.x,
          top: typeof state.y === 'number' ? `${state.y}px` : state.y,
          width: typeof state.width === 'number' ? `${state.width}px` : state.width,
          height: typeof state.height === 'number' ? `${state.height}px` : state.height,
          zIndex: state.zIndex,
      };
  };

  return (
    <div 
      onMouseDown={() => onFocus(state.id)}
      className={`absolute bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.7)] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 ease-out ${state.isMinimized ? 'opacity-0 scale-75 pointer-events-none invisible translate-y-10' : 'opacity-100 scale-100'}`}
      style={{
        ...getStyle(),
        display: state.isMinimized ? 'none' : 'flex',
      }}
    >
      {/* Barra de Título Optimizada */}
      <div className={`flex items-center px-4 sm:px-6 shrink-0 cursor-move select-none border-b border-white/5 bg-white/5 ${isMobile ? 'h-10' : 'h-14'}`}>
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${state.zIndex > 100 ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]' : 'bg-gray-600'}`} />
            <span className="text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] sm:tracking-[0.3em] truncate drop-shadow-md">{state.title}</span>
        </div>
        <div className="flex gap-1 sm:gap-2 relative z-[60]">
          <button onClick={handleMinimize} className="p-1.5 sm:p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"><Minus size={isMobile ? 12 : 16}/></button>
          <button onClick={handleMaximize} className="p-1.5 sm:p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">{state.isMaximized ? <Square size={isMobile ? 10 : 14}/> : <Maximize2 size={isMobile ? 10 : 14}/>}</button>
          <button onClick={handleClose} className="p-1.5 sm:p-2.5 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400 transition-all"><X size={isMobile ? 12 : 16}/></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative bg-black/10">
        {children}
      </div>
    </div>
  );
};
