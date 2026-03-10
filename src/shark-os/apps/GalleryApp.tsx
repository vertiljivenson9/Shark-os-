import React, { useState, useEffect, useCallback } from 'react';
import { kernel } from '../services/kernel';
import { Image as ImageIcon, ArrowLeft, Trash2 } from 'lucide-react';

interface Photo {
  name: string;
  path: string;
  src: string;
}

export const GalleryApp: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const dir = '/user/home/photos';
      if (await kernel.fs.exists(dir)) {
        const files = await kernel.fs.ls(dir);
        const loaded: Photo[] = [];
        
        for (const file of files) {
          if (file.endsWith('.png') || file.endsWith('.jpg')) {
             try {
               const path = `${dir}/${file}`;
               const content = await kernel.fs.cat(path);
               loaded.push({ name: file, path, src: content });
             } catch (e) {}
          }
        }
        // Newest first
        setPhotos(loaded.reverse());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const deletePhoto = async (photo: Photo) => {
    if (confirm('Delete this photo?')) {
      await kernel.fs.rm(photo.path);
      setSelectedPhoto(null);
      loadPhotos();
    }
  };

  if (selectedPhoto) {
    return (
      <div className="h-full bg-black flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-10">
          <button onClick={() => setSelectedPhoto(null)} className="text-white hover:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <span className="text-white text-xs font-mono">{selectedPhoto.name}</span>
          <button onClick={() => deletePhoto(selectedPhoto)} className="text-red-400 hover:text-red-300">
            <Trash2 size={24} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <img src={selectedPhoto.src} className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-10">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
           <ImageIcon className="text-blue-500" /> Gallery
        </h1>
        <p className="text-xs text-gray-500">{photos.length} Photos</p>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {loading ? (
          <div className="text-gray-500 text-center mt-10 text-sm">Loading media...</div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <ImageIcon size={48} className="mb-2 opacity-20" />
            <p>No photos yet</p>
            <p className="text-xs mt-1">Take some with Camera app</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 content-start">
            {photos.map(p => (
              <div 
                key={p.name} 
                onClick={() => setSelectedPhoto(p)}
                className="aspect-square bg-gray-800 relative cursor-pointer overflow-hidden group"
              >
                <img src={p.src} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};