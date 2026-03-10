import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2 } from 'lucide-react';
import { kernel } from '../services/kernel';

const DEMO_TRACK = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

interface MusicProps {
    file?: string;
}

export const MusicApp: React.FC<MusicProps> = ({ file }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackSrc, setTrackSrc] = useState(DEMO_TRACK);
  const [trackName, setTrackName] = useState("Demo Track");
  
  const audioRef = useRef<HTMLAudioElement>(new Audio(DEMO_TRACK));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const loadFile = async () => {
        if (file) {
            try {
                // Assume DataURL string from VFS
                const content = await kernel.fs.cat(file);
                setTrackSrc(content);
                setTrackName(file.split('/').pop() || 'Unknown Track');
                // Re-init audio element source
                audioRef.current.src = content;
                audioRef.current.load();
                setPlaying(true); // Auto-play
            } catch (e) {
                console.error("Failed to load music", e);
            }
        }
    };
    loadFile();
  }, [file]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";
    
    // Setup Audio Context for Visualizer
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    
    // Connect nodes
    try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
        analyserRef.current = analyser;
    } catch (e) {
        // Source might already be connected if re-mounting
    }

    // Events
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnd);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (playing) {
        audioRef.current.play().catch(e => {
            if (e.name !== 'AbortError') console.error("Audio play failed", e);
        });
        drawVisualizer();
    } else {
        audioRef.current.pause();
        cancelAnimationFrame(animationRef.current);
    }
  }, [playing]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const render = () => {
        analyserRef.current!.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2; // Scale down
            
            const r = barHeight + 25 * (i/bufferLength);
            const g = 250 * (i/bufferLength);
            const b = 50;

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        if (playing) {
            animationRef.current = requestAnimationFrame(render);
        }
    };
    render();
  };

  const formatTime = (t: number) => {
    if (isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full bg-gradient-to-br from-indigo-900 to-purple-900 text-white flex flex-col p-6">
       {/* Album Art / Visualizer */}
       <div className="flex-1 flex items-center justify-center relative mb-6">
           <div className="w-48 h-48 bg-black/30 rounded-full flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/10">
                <Music size={64} className="text-white/50" />
           </div>
           {/* Visualizer Canvas */}
           <canvas 
                ref={canvasRef} 
                width={300} 
                height={200} 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-50"
           />
       </div>

       {/* Info */}
       <div className="text-center mb-8">
           <h2 className="text-xl font-bold tracking-wide truncate px-4">{trackName}</h2>
           <p className="text-sm text-purple-300">Local Music</p>
       </div>

       {/* Controls */}
       <div className="space-y-4">
           {/* Progress */}
           <div className="space-y-1">
               <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={(e) => { audioRef.current.currentTime = Number(e.target.value); setCurrentTime(Number(e.target.value)); }}
                  className="w-full h-1 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
               />
               <div className="flex justify-between text-[10px] text-purple-300 font-mono">
                   <span>{formatTime(currentTime)}</span>
                   <span>{formatTime(duration)}</span>
               </div>
           </div>

           {/* Buttons */}
           <div className="flex items-center justify-center gap-6">
               <button className="text-purple-300 hover:text-white transition-colors"><SkipBack size={24} /></button>
               <button 
                onClick={() => setPlaying(!playing)}
                className="w-16 h-16 bg-white text-purple-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
               >
                   {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
               </button>
               <button className="text-purple-300 hover:text-white transition-colors"><SkipForward size={24} /></button>
           </div>
           
           {/* Volume */}
           <div className="flex items-center gap-2 justify-center mt-4 opacity-70 hover:opacity-100 transition-opacity">
               <Volume2 size={14} />
               <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-white"
               />
           </div>
       </div>
    </div>
  );
};