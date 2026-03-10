import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, SkipBack, SkipForward, Film, AlertTriangle } from 'lucide-react';
import { kernel } from '../services/kernel';

const SAMPLE_VIDEO = "https://media.w3.org/2010/05/sintel/trailer.mp4"; // Open media sample

interface VideoProps {
    file?: string;
}

export const VideoPlayerApp: React.FC<VideoProps> = ({ file }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [duration, setDuration] = useState(0);
  const [videoSrc, setVideoSrc] = useState(SAMPLE_VIDEO);
  const [title, setTitle] = useState("Sintel (Demo)");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to convert base64 DataURI to Blob, then Object URL
  // This is CRITICAL for large videos (like screen recordings) or non-mp4 formats
  // because direct DataURIs can crash the browser buffer or be rejected by the media engine.
  const createObjectUrlFromDataUri = async (dataUri: string): Promise<string> => {
      try {
          const res = await fetch(dataUri);
          const blob = await res.blob();
          return URL.createObjectURL(blob);
      } catch (e) {
          console.error("Blob conversion failed", e);
          return dataUri; // Fallback
      }
  };

  // 1. Load File from VFS
  useEffect(() => {
    let activeObjectUrl: string | null = null;

    const loadFile = async () => {
        if (file) {
            setLoading(true);
            setError(null);
            setPlaying(false);
            try {
                // Read from VFS. Expected format: DataURL (base64) string
                const content = await kernel.fs.cat(file);
                
                // If it's a URL (http/https), use directly
                if (content.startsWith('http')) {
                    setVideoSrc(content);
                } else {
                    // It's likely a Data URL.
                    // IMPORTANT: Convert to Blob URL for stability with large files (screen recordings)
                    const objUrl = await createObjectUrlFromDataUri(content);
                    activeObjectUrl = objUrl;
                    setVideoSrc(objUrl);
                }

                setTitle(file.split('/').pop() || 'Video');
            } catch (e: any) {
                console.error("Failed to load video file", e);
                setError(`Could not load video: ${e.message}`);
            } finally {
                setLoading(false);
            }
        }
    };
    loadFile();

    return () => {
        if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    };
  }, [file]);

  // 2. Force DOM reload when src changes
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.load();
        if (videoSrc !== SAMPLE_VIDEO) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setPlaying(true))
                    .catch(e => {
                        console.log("Autoplay prevented or format issue:", e);
                        // Don't show error immediately on autoplay fail, just pause
                        setPlaying(false);
                    });
            }
        }
    }
  }, [videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if(!v) return;

    const update = () => setProgress((v.currentTime / v.duration) * 100);
    const onLoaded = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    const onError = (e: any) => {
        const err = v.error;
        let msg = 'Unknown playback error';
        if (err) {
            switch(err.code) {
                case 1: msg = 'Aborted by user'; break;
                case 2: msg = 'Network error during loading'; break;
                case 3: msg = 'Decoding failed (Corrupt file?)'; break;
                case 4: msg = 'Format not supported by browser'; break;
            }
        }
        console.error("Video Error:", err);
        setError(msg);
    };

    v.addEventListener('timeupdate', update);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnd);
    v.addEventListener('error', onError);

    return () => {
        v.removeEventListener('timeupdate', update);
        v.removeEventListener('loadedmetadata', onLoaded);
        v.removeEventListener('play', onPlay);
        v.removeEventListener('pause', onPause);
        v.removeEventListener('ended', onEnd);
        v.removeEventListener('error', onError);
    }
  }, [videoSrc]); 

  const togglePlay = () => {
    if (videoRef.current) {
        if (playing) {
            videoRef.current.pause();
        } else {
            videoRef.current.play().catch(e => console.error(e));
        }
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      if (videoRef.current) {
          videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
      }
  };

  const toggleFullscreen = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else containerRef.current?.requestFullscreen();
  };

  const formatTime = (seconds: number) => {
      if (isNaN(seconds)) return "0:00";
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (error) {
      return (
          <div className="h-full bg-black flex flex-col items-center justify-center text-red-500 p-6 text-center">
              <AlertTriangle size={48} className="mb-4" />
              <h2 className="text-xl font-bold">Video Error</h2>
              <p className="text-sm mt-2 text-gray-400">{error}</p>
              <p className="text-xs text-gray-500 mt-4">Tip: Ensure file is a supported web video (MP4/WebM)</p>
          </div>
      );
  }

  return (
    <div 
        ref={containerRef}
        className="h-full bg-black flex flex-col justify-center relative group overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => !hovered && setHovered(true)} // Tap to show controls on mobile
    >
      {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
             <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      )}

      <video 
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain bg-black"
        playsInline // CRITICAL for mobile rendering
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
      />
      
      {/* Overlay Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${hovered || !playing ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-white font-mono">{formatTime(videoRef.current?.currentTime || 0)}</span>
              <input 
                type="range" 
                min="0" max="100" 
                value={progress || 0}
                onChange={seek}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <span className="text-xs text-white font-mono">{formatTime(duration || 0)}</span>
          </div>

          <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
                      {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  
                  <div className="flex items-center gap-2 group/vol">
                      <Volume2 size={20} className="text-gray-300"/>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={volume}
                        onChange={(e) => { 
                            const v = Number(e.target.value);
                            setVolume(v); 
                            if(videoRef.current) videoRef.current.volume = v; 
                        }}
                        className="w-20 h-1 bg-gray-600 rounded appearance-none accent-white"
                      />
                  </div>
              </div>

              <div className="text-xs text-gray-400 font-medium truncate max-w-[150px]">
                  {title}
              </div>

              <button onClick={toggleFullscreen} className="text-white hover:text-white/80">
                  <Maximize size={20} />
              </button>
          </div>
      </div>

      {!playing && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                  <Play size={32} fill="white" className="text-white ml-1" />
              </div>
          </div>
      )}
    </div>
  );
};