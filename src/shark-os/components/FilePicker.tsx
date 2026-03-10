import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Folder, File, X } from 'lucide-react';

interface FilePickerProps {
  onSelect: (path: string) => void;
  onCancel: () => void;
  mode?: 'read' | 'write';
}

export const FilePicker: React.FC<FilePickerProps> = ({ onSelect, onCancel }) => {
  const [currentPath, setCurrentPath] = useState('/user/home');
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    loadDir(currentPath);
  }, [currentPath]);

  const loadDir = async (path: string) => {
    try {
      const list = await kernel.fs.ls(path);
      setItems(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (item: string) => {
    const fullPath = item.startsWith('/') ? item : `${currentPath}/${item}`.replace('//', '/');
    const isDir = item.endsWith('/'); // Basic convention check from LS output
    
    if (isDir) {
      setCurrentPath(fullPath.slice(0, -1)); // Remove trailing slash for path state
    } else {
      onSelect(fullPath);
    }
  };

  const goUp = () => {
    const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    setCurrentPath(parent);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-os-panel border border-os-border w-96 h-96 flex flex-col rounded-lg shadow-2xl">
        <div className="flex justify-between items-center p-3 border-b border-os-border">
          <span className="text-white font-bold">Select File</span>
          <button onClick={onCancel}><X size={18} className="text-gray-400 hover:text-white" /></button>
        </div>
        <div className="bg-os-bg p-2 text-xs text-gray-400 truncate">{currentPath}</div>
        <div className="flex-1 overflow-y-auto p-2">
          {currentPath !== '/' && (
            <div onClick={goUp} className="flex items-center p-2 hover:bg-white/5 rounded cursor-pointer text-gray-300">
               <Folder size={16} className="mr-2 text-yellow-500" /> ..
            </div>
          )}
          {items.map((item) => (
            <div 
              key={item} 
              onClick={() => handleItemClick(item)}
              className="flex items-center p-2 hover:bg-white/5 rounded cursor-pointer text-gray-200"
            >
              {item.endsWith('/') ? <Folder size={16} className="mr-2 text-yellow-500" /> : <File size={16} className="mr-2 text-blue-400" />}
              {item.replace(/\/$/, '')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};