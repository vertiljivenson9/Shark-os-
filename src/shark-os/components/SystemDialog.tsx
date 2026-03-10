'use client';

import React, { useEffect, useState } from 'react';
import { soundSystem, SoundType } from '../services/media/SoundSystem';
import { AlertTriangle, CheckCircle, Info, XCircle, HelpCircle, X } from 'lucide-react';

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'question';

interface DialogButton {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface SystemDialogProps {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  detail?: string;
  buttons?: DialogButton[];
  onClose: () => void;
  sound?: SoundType;
}

const typeStyles = {
  info: {
    icon: <Info size={48} className="text-blue-400" />,
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20'
  },
  success: {
    icon: <CheckCircle size={48} className="text-green-400" />,
    bg: 'from-green-500/20 to-green-600/10',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20'
  },
  warning: {
    icon: <AlertTriangle size={48} className="text-yellow-400" />,
    bg: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20'
  },
  error: {
    icon: <XCircle size={48} className="text-red-400" />,
    bg: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20'
  },
  question: {
    icon: <HelpCircle size={48} className="text-purple-400" />,
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20'
  }
};

const defaultSounds: Record<DialogType, SoundType> = {
  info: 'notification',
  success: 'success',
  warning: 'warning',
  error: 'error',
  question: 'question'
};

export const SystemDialog: React.FC<SystemDialogProps> = ({
  isOpen,
  type,
  title,
  message,
  detail,
  buttons,
  onClose,
  sound
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const styles = typeStyles[type];

  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to avoid setState in effect
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      soundSystem.play(sound || defaultSounds[type]);
      
      // Shake effect para errores
      if (type === 'error') {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, type, sound]);

  if (!isOpen) return null;

  const handleButtonClick = (btn: DialogButton) => {
    soundSystem.play('click');
    btn.onClick();
  };

  const handleClose = () => {
    soundSystem.play('close');
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div 
        className={`relative bg-gradient-to-br ${styles.bg} backdrop-blur-2xl border ${styles.border} rounded-3xl p-6 max-w-md w-full shadow-2xl ${styles.glow} transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} ${isShaking ? 'animate-shake' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} className="text-white/50 hover:text-white" />
        </button>
        
        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon with pulse animation */}
          <div className="mb-4 relative">
            <div className="absolute inset-0 animate-ping opacity-20">
              {styles.icon}
            </div>
            <div className="relative">
              {styles.icon}
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          
          {/* Message */}
          <p className="text-white/80 text-sm leading-relaxed mb-2">{message}</p>
          
          {/* Detail */}
          {detail && (
            <p className="text-white/50 text-xs mt-2 p-3 bg-black/20 rounded-lg font-mono break-all max-h-24 overflow-auto">
              {detail}
            </p>
          )}
          
          {/* Buttons */}
          {buttons && buttons.length > 0 && (
            <div className="flex gap-3 mt-6 w-full">
              {buttons.map((btn, i) => (
                <button
                  key={i}
                  onClick={() => handleButtonClick(btn)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all transform hover:scale-[1.02] active:scale-95 ${
                    btn.variant === 'primary' 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : btn.variant === 'danger'
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white/90'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook para mostrar diálogos fácilmente
export const useDialog = () => {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
    detail?: string;
    buttons?: DialogButton[];
    sound?: SoundType;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const show = (
    type: DialogType,
    title: string,
    message: string,
    detail?: string,
    buttons?: DialogButton[],
    sound?: SoundType
  ) => {
    setDialog({ isOpen: true, type, title, message, detail, buttons, sound });
  };

  const close = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const info = (title: string, message: string, detail?: string) => 
    show('info', title, message, detail);
  
  const success = (title: string, message: string) => 
    show('success', title, message);
  
  const warning = (title: string, message: string, detail?: string) => 
    show('warning', title, message, detail);
  
  const error = (title: string, message: string, detail?: string) => 
    show('error', title, message, detail);
  
  const confirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    show('question', title, message, undefined, [
      { label: 'Cancelar', variant: 'secondary', onClick: () => { close(); onCancel?.(); } },
      { label: 'Confirmar', variant: 'primary', onClick: () => { close(); onConfirm(); } }
    ]);
  };

  return {
    dialog,
    close,
    show,
    info,
    success,
    warning,
    error,
    confirm
  };
};

// Componente para renderizar el diálogo con el hook
export const DialogRenderer: React.FC<{ dialog: ReturnType<typeof useDialog>['dialog']; onClose: () => void }> = ({ dialog, onClose }) => (
  <SystemDialog
    isOpen={dialog.isOpen}
    type={dialog.type}
    title={dialog.title}
    message={dialog.message}
    detail={dialog.detail}
    buttons={dialog.buttons}
    onClose={onClose}
    sound={dialog.sound}
  />
);
