'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { soundSystem, SoundType } from '../services/media/SoundSystem';
import { 
  CheckCircle, XCircle, AlertTriangle, Info, Bell, 
  Mail, MessageSquare, Download, Upload, Trash2, 
  Copy, AlertCircle, Zap
} from 'lucide-react';

export type ToastType = 
  | 'info' | 'success' | 'warning' | 'error' 
  | 'notification' | 'message' | 'mail' 
  | 'download' | 'upload' | 'delete' | 'copy';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  actions?: { label: string; onClick: () => void }[];
  sound?: SoundType | false;
}

const toastConfig = {
  info: { icon: Info, color: 'blue', gradient: 'from-blue-500/30 to-blue-600/20' },
  success: { icon: CheckCircle, color: 'green', gradient: 'from-green-500/30 to-green-600/20' },
  warning: { icon: AlertTriangle, color: 'yellow', gradient: 'from-yellow-500/30 to-yellow-600/20' },
  error: { icon: XCircle, color: 'red', gradient: 'from-red-500/30 to-red-600/20' },
  notification: { icon: Bell, color: 'purple', gradient: 'from-purple-500/30 to-purple-600/20' },
  message: { icon: MessageSquare, color: 'cyan', gradient: 'from-cyan-500/30 to-cyan-600/20' },
  mail: { icon: Mail, color: 'pink', gradient: 'from-pink-500/30 to-pink-600/20' },
  download: { icon: Download, color: 'emerald', gradient: 'from-emerald-500/30 to-emerald-600/20' },
  upload: { icon: Upload, color: 'indigo', gradient: 'from-indigo-500/30 to-indigo-600/20' },
  delete: { icon: Trash2, color: 'rose', gradient: 'from-rose-500/30 to-rose-600/20' },
  copy: { icon: Copy, color: 'violet', gradient: 'from-violet-500/30 to-violet-600/20' }
};

const defaultSounds: Record<ToastType, SoundType> = {
  info: 'notification',
  success: 'success',
  warning: 'warning',
  error: 'error',
  notification: 'notification',
  message: 'message',
  mail: 'mail',
  download: 'download',
  upload: 'upload',
  delete: 'delete',
  copy: 'copy'
};

const colorClasses: Record<string, { text: string; bg: string }> = {
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
  green: { text: 'text-green-400', bg: 'bg-green-500/20' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  red: { text: 'text-red-400', bg: 'bg-red-500/20' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-500/20' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/20' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/20' }
};

// Cola global de toasts
type ToastCallback = (toast: ToastData) => void;
let toastCallback: ToastCallback | null = null;

export const toast = {
  show: (toast: Omit<ToastData, 'id'>) => {
    if (toastCallback) {
      toastCallback({ ...toast, id: crypto.randomUUID() });
    }
  },
  info: (title: string, message?: string) => toast.show({ type: 'info', title, message }),
  success: (title: string, message?: string) => toast.show({ type: 'success', title, message }),
  warning: (title: string, message?: string) => toast.show({ type: 'warning', title, message }),
  error: (title: string, message?: string) => toast.show({ type: 'error', title, message }),
  notification: (title: string, message?: string) => toast.show({ type: 'notification', title, message }),
  message: (title: string, message?: string) => toast.show({ type: 'message', title, message }),
  mail: (title: string, message?: string) => toast.show({ type: 'mail', title, message }),
  download: (title: string, message?: string) => toast.show({ type: 'download', title, message }),
  upload: (title: string, message?: string) => toast.show({ type: 'upload', title, message }),
  delete: (title: string, message?: string) => toast.show({ type: 'delete', title, message }),
  copy: (title: string, message?: string) => toast.show({ type: 'copy', title, message })
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isEntering, setIsEntering] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const colors = colorClasses[config.color];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    // Animación de entrada
    const enterTimer = setTimeout(() => setIsEntering(false), 50);
    
    // Reproducir sonido
    if (toast.sound !== false) {
      soundSystem.play(toast.sound ?? defaultSounds[toast.type]);
    }
    
    // Auto-dismiss con progress bar
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        clearInterval(progressInterval);
      }
    }, 16);

    const dismissTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [toast.id, toast.type, toast.sound, duration, onDismiss]);

  const handleClick = () => {
    soundSystem.play('click');
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} backdrop-blur-2xl border border-white/10 shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
        isEntering ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      } ${isLeaving ? 'opacity-0 translate-x-full scale-95' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icono con pulso */}
        <div className={`shrink-0 ${colors.bg} p-2 rounded-xl relative`}>
          <div className="absolute inset-0 animate-ping opacity-20 rounded-xl bg-current" />
          <Icon size={20} className={colors.text} />
        </div>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm">{toast.title}</h4>
          {toast.message && (
            <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{toast.message}</p>
          )}
          
          {/* Actions */}
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex gap-2 mt-2">
              {toast.actions.map((action, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    onDismiss(toast.id);
                  }}
                  className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                    i === 0 ? `${colors.bg} ${colors.text}` : 'bg-white/10 text-white/70'
                  } hover:bg-white/20`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Close hint */}
        <div className="text-white/30 text-[10px] shrink-0">Toca para cerrar</div>
      </div>
      
      {/* Progress bar */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-white/30 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// Container de toasts
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((newToast: ToastData) => {
    setToasts(prev => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    toastCallback = addToast;
    return () => { toastCallback = null; };
  }, [addToast]);

  return (
    <div className="fixed top-14 right-4 z-[9998] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
};

// Export del hook para usar en componentes
export const useToast = () => {
  return toast;
};
