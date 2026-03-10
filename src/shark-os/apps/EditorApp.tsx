import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { FilePicker } from '../components/FilePicker';
import { Save, FolderOpen, RefreshCw } from 'lucide-react';

interface EditorProps {
    file?: string;
}

export const EditorApp: React.FC<EditorProps> = ({ file }) => {
  const [filePath, setFilePath] = useState('/user/home/notes.txt');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Ready');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    // If props passed a file, use it. Otherwise use default
    const target = file || filePath;
    setFilePath(target);
    checkAndLoad(target);
  }, [file]);

  const checkAndLoad = async (path: string) => {
      if (await kernel.fs.exists(path)) {
          try {
            const data = await kernel.fs.cat(path);
            setContent(data);
            setStatus(`Loaded ${path}`);
          } catch (e: any) {
            setStatus(`Read Error: ${e.message}`);
          }
      }
  }

  const loadFile = async () => {
    try {
      setStatus('Loading...');
      if (await kernel.fs.exists(filePath)) {
        const data = await kernel.fs.cat(filePath);
        setContent(data);
        setStatus(`Loaded ${filePath}`);
      } else {
        setContent('');
        setStatus('New File (Path does not exist yet)');
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const saveFile = async () => {
    try {
      setStatus('Saving...');
      // Try to create parent directory if it's missing (shallow check)
      const parent = filePath.substring(0, filePath.lastIndexOf('/'));
      if (parent && parent !== '/' && !(await kernel.fs.exists(parent))) {
          await kernel.fs.mkdir(parent).catch(() => {});
      }
      
      await kernel.fs.write(filePath, content);
      setStatus(`Saved to ${filePath}`);
    } catch (e: any) {
      setStatus(`Error saving: ${e.message}`);
    }
  };

  const onFilePick = (path: string) => {
      setFilePath(path);
      setShowPicker(false);
      checkAndLoad(path);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white relative">
      {showPicker && (
        <FilePicker 
            onSelect={onFilePick} 
            onCancel={() => setShowPicker(false)} 
        />
      )}

      <div className="flex items-center p-2 bg-gray-800 border-b border-gray-700 space-x-2">
        <button 
            onClick={() => setShowPicker(true)} 
            className="p-1.5 hover:bg-gray-700 rounded text-blue-400 transition-colors" 
            title="Open from Explorer"
        >
            <FolderOpen size={18} />
        </button>
        
        <div className="flex-1 flex items-center bg-gray-700 rounded px-2 border border-gray-600 focus-within:border-blue-500 transition-colors">
            <span className="text-xs text-gray-400 mr-2 font-mono">PATH:</span>
            <input 
                className="flex-1 bg-transparent border-none py-1 text-sm outline-none text-gray-200 font-mono"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
            />
        </div>

        <button 
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 text-xs rounded flex items-center gap-2 transition-colors" 
            onClick={loadFile}
        >
            <RefreshCw size={14}/> Reload
        </button>
        
        <button 
            className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs rounded flex items-center gap-2 font-bold transition-colors shadow-lg shadow-blue-900/30" 
            onClick={saveFile}
        >
            <Save size={14}/> Save
        </button>
      </div>
      
      <div className="flex-1 relative">
        <textarea
            className="absolute inset-0 w-full h-full p-4 bg-[#1e1e1e] text-gray-200 font-mono text-sm resize-none outline-none leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
        />
      </div>
      
      <div className="bg-gray-800 px-3 py-1 text-[10px] text-gray-400 border-t border-gray-700 flex justify-between items-center font-mono">
        <span>{status}</span>
        <span>{content.length} chars</span>
      </div>
    </div>
  );
};