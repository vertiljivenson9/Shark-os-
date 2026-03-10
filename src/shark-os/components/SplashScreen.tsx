import React, { useEffect, useState } from 'react';
import { kernel } from '../services/kernel';

interface SplashProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashProps> = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const run = async () => {
      // User Requirement: At least 7 seconds to admire the logo
      let duration = 7000; 
      try {
        const conf = await kernel.registry.get('system.ui.splash_duration_ms');
        if (conf) duration = Number(conf);
      } catch (e) {}

      setTimeout(() => {
        setOpacity(0);
        setTimeout(onComplete, 1000); 
      }, duration);
    };
    run();
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-black flex items-center justify-center transition-opacity duration-1000 ease-in-out"
      style={{ opacity, pointerEvents: opacity === 0 ? 'none' : 'auto' }}
    >
      <div className="text-center flex flex-col items-center animate-in fade-in zoom-in duration-1000">
        {/* Muscular Evil Shark Logo */}
        <div className="relative w-64 h-64 mb-8">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">
                <defs>
                    <linearGradient id="sharkBody" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                </defs>
                
                {/* Muscular Right Arm (Fin) */}
                <path d="M140 100 Q 170 80 180 110 Q 190 140 160 130 Q 150 120 140 130" fill="url(#sharkBody)" stroke="white" strokeWidth="2"/>
                
                {/* Muscular Left Arm (Fin) */}
                <path d="M60 100 Q 30 80 20 110 Q 10 140 40 130 Q 50 120 60 130" fill="url(#sharkBody)" stroke="white" strokeWidth="2"/>

                {/* Main Body/Torso - V Shape */}
                <path d="M70 180 L 130 180 L 120 100 L 80 100 Z" fill="url(#sharkBody)" stroke="white" strokeWidth="2"/>

                {/* Head - Aggressive Shape */}
                <path d="M100 20 C 130 30 150 60 140 100 L 60 100 C 50 60 70 30 100 20 Z" fill="url(#sharkBody)" stroke="white" strokeWidth="2"/>

                {/* Dorsal Fin (Mohawk style) */}
                <path d="M100 20 L 80 50 L 100 40 L 120 50 Z" fill="#1e3a8a" />

                {/* Evil Eyes */}
                <path d="M80 60 L 95 65 L 80 70 Z" fill="white" />
                <path d="M120 60 L 105 65 L 120 70 Z" fill="white" />
                <circle cx="85" cy="65" r="2" fill="red" className="animate-pulse"/>
                <circle cx="115" cy="65" r="2" fill="red" className="animate-pulse"/>

                {/* Evil Grin (Teeth) */}
                <path d="M70 85 Q 100 105 130 85" fill="none" stroke="black" strokeWidth="3" />
                <path d="M70 85 L 75 95 L 80 88 L 85 95 L 90 89 L 95 95 L 100 90 L 105 95 L 110 89 L 115 95 L 120 88 L 125 95 L 130 85" fill="white" stroke="black" strokeWidth="1"/>
            </svg>
        </div>
        
        <h1 className="text-5xl font-black text-white tracking-[0.5em] ml-4 drop-shadow-lg">SHARK OS</h1>
        <p className="text-blue-400 text-sm font-mono mt-4 tracking-widest animate-pulse">APEX PREDATOR EDITION</p>
        
        <div className="mt-8 w-64 h-1 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div className="h-full bg-blue-600 animate-[loading_7s_ease-in-out_forwards]"></div>
        </div>
      </div>
      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
};