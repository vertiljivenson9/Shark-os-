import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, Circle, X } from 'lucide-react';
import { kernel } from '../services/kernel';
import { soundSystem } from '../services/media/SoundSystem';

export const CameraApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setError(null);
    } catch (e: any) {
      setError("Camera Access Denied: " + e.message);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      setFlash(true);
      soundSystem.play('click');
      setTimeout(() => setFlash(false), 150);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        
        const filename = `IMG_${Date.now()}.png`;
        const path = `/user/home/photos/${filename}`;
        
        await kernel.fs.write(path, dataUrl);
        kernel.notifications.push('Photo Saved', `Saved to ${path}`);
        soundSystem.play('success');
      }
    }
  };

  if (error) {
    return (
        <div className="h-full bg-black text-white flex flex-col items-center justify-center p-4 text-center">
            <Camera size={48} className="mb-4 text-gray-600"/>
            <h2 className="text-xl font-bold mb-2">Camera Unavailable</h2>
            <p className="text-gray-400 text-sm">{error}</p>
        </div>
    );
  }

  return (
    <div className="h-full bg-black relative flex flex-col overflow-hidden">
      {/* Viewfinder */}
      <div className="flex-1 relative bg-gray-900">
         <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
         />
         <canvas ref={canvasRef} className="hidden" />
         
         {/* Flash Effect */}
         <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${flash ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Controls */}
      <div className="h-24 bg-black/80 backdrop-blur flex items-center justify-between px-8 absolute bottom-0 w-full z-10">
         <button 
           className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 active:scale-90 transition-all" 
           onClick={() => { stopCamera(); startCamera(); }}
         >
            <RefreshCw size={20} className="text-white"/>
         </button>

         <button 
            onClick={takePhoto}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
         >
            <div className="w-14 h-14 bg-white rounded-full" />
         </button>

         <div className="w-12 h-12" />
      </div>
    </div>
  );
};
