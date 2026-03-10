import React, { useState, useEffect, useRef } from 'react';
import { kernel } from '../services/kernel';
import { OPFSBackend } from '../services/vfs/opfs';
import { NativeFSBackend } from '../services/vfs/native';
import { Folder, File, HardDrive, ShieldCheck, Lock, ChevronRight, Home, Server, Plus, Trash2, Shield, AlertTriangle, CheckCircle, Unlock, Key, Image as ImageIcon, Video, FileText, Upload, Music, Usb, Download } from 'lucide-react';

export const FilesApp: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/user/home');
  const [items, setItems] = useState<string[]>([]);
  const [status, setStatus] = useState('Ready');
  const [secureMounted, setSecureMounted] = useState(false);
  const [usbMounted, setUsbMounted] = useState(false);
  const [quota, setQuota] = useState<{usage: number, quota: number} | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Permission & Auth State
  const [showPermDialog, setShowPermDialog] = useState(false);
  const [permStep, setPermStep] = useState(0); 
  const [password, setPassword] = useState('');
  const [tempOpfs, setTempOpfs] = useState<OPFSBackend | null>(null);
  
  // Hidden input for file import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile Double Tap Logic Refs
  const lastTapRef = useRef<number>(0);
  const lastTapItemRef = useRef<string>('');

  useEffect(() => {
    refresh(currentPath);
    checkMounts();
    setSelectedItem(null); // Reset selection on nav
  }, [currentPath]);

  const checkMounts = async () => {
    const isSecure = await kernel.fs.exists('/user/secure');
    setSecureMounted(isSecure);
    
    const isUsb = await kernel.fs.exists('/usb');
    setUsbMounted(isUsb);

    if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        setQuota({ usage: est.usage || 0, quota: est.quota || 0 });
    }
  };

  const refresh = async (path: string) => {
    try {
      setStatus('Scanning...');
      const list = await kernel.fs.ls(path);
      setItems(list);
      setStatus(`${list.length} items`);
    } catch (e: any) {
      setItems([]);
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  // Improved Interaction Handler (Works for Mouse Click & Touch Tap)
  const handleItemInteraction = (item: string) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // ms

      setSelectedItem(item); // Always select on first tap

      if (lastTapItemRef.current === item && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
          // Double Tap Detected!
          handleOpen(item);
          lastTapRef.current = 0; // Reset
      } else {
          // First Tap
          lastTapRef.current = now;
          lastTapItemRef.current = item;
      }
  };

  const handleOpen = async (name: string) => {
    const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    const isDir = name.endsWith('/');
    
    if (isDir) {
      handleNavigate(fullPath.slice(0, -1));
    } else {
      // FILE ASSOCIATIONS LOGIC
      const ext = name.split('.').pop()?.toLowerCase();

      if (['txt', 'md', 'js', 'json', 'ts', 'tsx', 'css', 'html'].includes(ext || '')) {
          kernel.launchApp('editor', { file: fullPath });
      } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext || '')) {
          kernel.launchApp('gallery', { file: fullPath });
      } else if (['mp4', 'webm', 'mov', 'mkv', 'avi', '3gp', 'ts', 'wmv', 'm4v'].includes(ext || '')) {
          kernel.launchApp('video', { file: fullPath });
      } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) {
          kernel.launchApp('music', { file: fullPath });
      } else if (ext === 'vpx') {
          const choice = confirm(`Install package ${name}?`);
          if (choice) {
              try {
                  await kernel.pkg.installVPX(fullPath);
                  kernel.notifications.push('Package Installed', name);
              } catch (e: any) {
                  alert(e.message);
              }
          }
      } else {
          try {
            const content = await kernel.fs.cat(fullPath);
            alert(`File: ${name}\nSize: ${content.length} bytes\n\nUnknown Type.`);
          } catch (e: any) {
            alert(e.message);
          }
      }
    }
  };

  // --- USB / OTG MOUNTING ---
  const mountUsb = async () => {
      // @ts-ignore
      if (!window.showDirectoryPicker) {
          alert("Your browser does not support Native File System Access (WebUSB/OTG hole). Try Chrome on Android or Desktop.");
          return;
      }
      try {
          // @ts-ignore
          const handle = await window.showDirectoryPicker();
          if (handle) {
              const backend = new NativeFSBackend(handle);
              // Mount to /usb
              kernel.fs.mount('/usb', backend);
              
              // Ensure mount point exists logically in VFS resolution if needed, 
              // but VFS mount logic usually handles the routing.
              
              setUsbMounted(true);
              handleNavigate('/usb');
              kernel.notifications.push('Drive Mounted', `Accessing hardware: ${handle.name}`);
          }
      } catch (e: any) {
          if (e.name !== 'AbortError') {
             alert(`Mount Failed: ${e.message}`);
          }
      }
  };

  // --- IMPORT LOGIC ---
  const triggerImport = () => {
      fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setStatus(`Importing ${files.length} files...`);

      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const reader = new FileReader();

          reader.onload = async (ev) => {
              const content = ev.target?.result as string;
              if (content) {
                  try {
                      await kernel.fs.write(`${currentPath}/${file.name}`, content);
                      refresh(currentPath);
                      kernel.notifications.push('File Imported', `${file.name} saved to ${currentPath}`);
                  } catch (err: any) {
                      kernel.notifications.push('Import Error', err.message, true);
                  }
              }
          };

          // Heuristic: Images/Video/Audio need Base64 (DataURL), Text needs Text
          if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
              reader.readAsDataURL(file);
          } else {
              reader.readAsText(file);
          }
      }
      // Reset input
      e.target.value = '';
      setStatus('Import complete');
  };
  
  // --- REAL EXPORT LOGIC ---
  const handleExport = async (name: string) => {
      if (!name) return;
      const fullPath = `${currentPath}/${name}`;
      try {
          const content = await kernel.fs.cat(fullPath);
          
          // Create a real blob
          let blob;
          if (content.startsWith('data:')) {
              // Base64 Data URI -> Blob
              const byteString = atob(content.split(',')[1]);
              const mimeString = content.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
              }
              blob = new Blob([ab], { type: mimeString });
          } else {
              // Text -> Blob
              blob = new Blob([content], { type: 'text/plain' });
          }
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name; // Filename on real host
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          kernel.notifications.push('Export Success', `${name} downloaded to host machine.`);
      } catch (e: any) {
          alert("Export Failed: " + e.message);
      }
  };

  // Step 1: Initialize, Check Permission & Detect Vault Status
  const startAuthFlow = async () => {
    setPermStep(1);
    try {
        const opfs = new OPFSBackend();
        const persisted = await opfs.requestPersistence();
        console.log('[Files] Persistence:', persisted);
        await opfs.mount();
        const isLocked = await opfs.isLocked();
        setTempOpfs(opfs);
        if (isLocked) setPermStep(3); 
        else setPermStep(2); 
    } catch (e: any) {
        alert(`Storage Access Error: ${e.message}`);
        setShowPermDialog(false);
    }
  };

  // Step 2: Handle Password Submission
  const handlePasswordSubmit = async () => {
      if (!tempOpfs || !password) return;
      setPermStep(1); 
      try {
          if (await tempOpfs.isLocked() === false) {
             if (await tempOpfs.createLock(password)) finalizeMount();
             else throw new Error('Failed to create lock');
          } else {
             if (await tempOpfs.unlock(password)) finalizeMount();
             else setPermStep(5);
          }
      } catch (e) {
          console.error(e);
          setPermStep(5);
      }
      setPassword('');
  };

  const finalizeMount = async () => {
      if (tempOpfs) {
          kernel.fs.mount('/user/secure', tempOpfs);
          setSecureMounted(true);
          setPermStep(4);
          setTimeout(() => {
              setShowPermDialog(false);
              setPermStep(0);
              handleNavigate('/user/secure');
              setTempOpfs(null);
          }, 1500);
      }
  };

  const createFolder = async () => {
    const name = prompt("Folder name:");
    if (name) {
        await kernel.fs.mkdir(`${currentPath}/${name}`);
        refresh(currentPath);
    }
  };

  const deleteItem = async (name: string) => {
    if (confirm(`Delete ${name}?`)) {
        await kernel.fs.rm(`${currentPath}/${name}`);
        refresh(currentPath);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
  };

  const getIcon = (name: string, isDir: boolean) => {
      if (isDir) return <Folder size={40} className="text-yellow-400 fill-yellow-100"/>;
      const ext = name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <ImageIcon size={36} className="text-purple-400"/>;
      if (['mp4', 'mov', 'mkv', 'webm', 'avi', '3gp', 'm4v'].includes(ext || '')) return <Video size={36} className="text-red-400"/>;
      if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music size={36} className="text-pink-400"/>;
      if (['txt', 'md', 'js'].includes(ext || '')) return <FileText size={36} className="text-blue-400"/>;
      return <File size={36} className="text-gray-400"/>;
  };

  return (
    <div className="flex h-full bg-gray-100 text-gray-800 font-sans relative">
      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileImport} />

      {/* Auth/Permission Overlay */}
      {showPermDialog && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-2xl p-6 w-80 max-w-full text-center">
                  {/* Step 0: Permission Prompt */}
                  {permStep === 0 && (
                      <>
                        <ShieldCheck size={48} className="text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">Secure Vault Access</h3>
                        <p className="text-sm text-gray-600 mb-4">Access encrypted storage (~2GB).</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => setShowPermDialog(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                            <button onClick={startAuthFlow} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30">Initialize</button>
                        </div>
                      </>
                  )}
                  {/* Step 1: Loading */}
                  {permStep === 1 && (
                      <>
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold">Verifying...</h3>
                      </>
                  )}
                  {/* Step 2/3: Password */}
                  {(permStep === 2 || permStep === 3) && (
                      <>
                        {permStep === 2 ? <Key size={48} className="text-blue-500 mx-auto mb-4" /> : <Lock size={48} className="text-yellow-500 mx-auto mb-4" />}
                        <h3 className="text-lg font-bold mb-1">{permStep === 2 ? 'Set Password' : 'Vault Locked'}</h3>
                        <input type="password" className="w-full bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm mb-4 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
                        <button onClick={handlePasswordSubmit} className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">{permStep === 2 ? 'Encrypt' : 'Unlock'}</button>
                      </>
                  )}
                  {/* Step 4/5 Success/Error */}
                  {permStep === 4 && <><Unlock size={48} className="text-green-500 mx-auto mb-4"/><h3 className="text-lg font-bold">Vault Mounted</h3></>}
                  {permStep === 5 && <><AlertTriangle size={48} className="text-red-500 mx-auto mb-4"/><h3 className="text-lg font-bold text-red-600">Access Denied</h3><button onClick={() => setPermStep(3)} className="mt-2 px-4 py-2 text-sm bg-gray-200 rounded">Try Again</button></>}
              </div>
          </div>
      )}

      {/* Sidebar */}
      <div className="w-48 bg-gray-200 border-r border-gray-300 flex flex-col pt-2">
        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Locations</div>
        <button onClick={() => handleNavigate('/')} className={`flex items-center px-4 py-2 text-sm ${currentPath === '/' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-300'}`}><Server size={16} className="mr-2"/> System Root</button>
        <button onClick={() => handleNavigate('/user/home')} className={`flex items-center px-4 py-2 text-sm ${currentPath.startsWith('/user/home') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-300'}`}><Home size={16} className="mr-2"/> Home</button>
        <button onClick={() => handleNavigate('/tmp')} className={`flex items-center px-4 py-2 text-sm ${currentPath.startsWith('/tmp') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-300'}`}><HardDrive size={16} className="mr-2"/> Temp</button>

        <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">External Devices</div>
        {usbMounted ? (
             <button onClick={() => handleNavigate('/usb')} className={`flex items-center px-4 py-2 text-sm ${currentPath.startsWith('/usb') ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-300'}`}><Usb size={16} className="mr-2 text-orange-600"/> USB Drive</button>
        ) : (
             <div className="px-4 py-2"><button onClick={mountUsb} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-2 px-2 rounded flex items-center justify-center gap-1 border border-gray-400 shadow-sm transition-all"><Usb size={12}/> Mount OTG</button></div>
        )}

        <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Secure Storage</div>
        {secureMounted ? (
            <button onClick={() => handleNavigate('/user/secure')} className={`flex items-center px-4 py-2 text-sm ${currentPath.startsWith('/user/secure') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-300'}`}><ShieldCheck size={16} className="mr-2 text-green-600"/> Secure Vault</button>
        ) : (
            <div className="px-4 py-2"><button onClick={() => setShowPermDialog(true)} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs py-2 px-2 rounded flex items-center justify-center gap-1 border border-gray-400 shadow-sm transition-all"><Lock size={12}/> Mount Vault</button></div>
        )}
        <div className="mt-auto p-3 bg-gray-300 m-2 rounded">
            <div className="text-[10px] uppercase font-bold text-gray-600 mb-1">Disk Usage</div>
            {quota ? <><div className="h-1.5 w-full bg-gray-400 rounded-full overflow-hidden mb-1"><div className="h-full bg-blue-500" style={{ width: `${(quota.usage / quota.quota) * 100}%` }}></div></div><div className="text-[10px] text-gray-600">{formatBytes(quota.usage)} used</div></> : <span className="text-[10px]">Calculating...</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
            <div className="flex-1 flex items-center gap-1 bg-gray-100 px-3 py-1 rounded text-sm text-gray-700 font-mono overflow-hidden">
                <HardDrive size={14} className="text-gray-400"/>
                {currentPath.split('/').map((part, i) => (
                    <React.Fragment key={i}>{i > 0 && <ChevronRight size={14} className="text-gray-400"/>}<span className="cursor-pointer hover:underline" onClick={() => handleNavigate('/' + currentPath.split('/').slice(1, i+1).join('/'))}>{part}</span></React.Fragment>
                ))}
            </div>
            <button onClick={triggerImport} className="p-2 hover:bg-blue-100 text-blue-600 rounded flex items-center gap-2 text-xs font-bold transition-colors" title="Import Files">
                <Upload size={18}/> Import
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button onClick={createFolder} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="New Folder"><Plus size={18}/></button>
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-auto p-4 bg-white select-none">
             {items.length === 0 && <div className="text-gray-400 text-center mt-10 text-sm">Folder is empty</div>}
             <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                 {items.map(item => {
                     const isDir = item.endsWith('/');
                     const cleanName = item.replace('/', '');
                     const isSelected = selectedItem === item;
                     
                     return (
                         <div key={item} 
                              className={`group flex flex-col items-center p-2 rounded cursor-pointer border transition-colors ${isSelected ? 'bg-blue-100 border-blue-300' : 'border-transparent hover:bg-gray-50'}`}
                              onClick={() => handleItemInteraction(item)}
                         >
                             <div className="w-12 h-12 flex items-center justify-center mb-1 transition-transform group-hover:scale-105 group-active:scale-95 relative">
                                 {getIcon(cleanName, isDir)}
                                 {!isDir && (
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); handleExport(cleanName); }}
                                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-500"
                                        title="Download to Host"
                                     >
                                         <Download size={10} />
                                     </button>
                                 )}
                             </div>
                             <span className={`text-xs text-center break-all leading-tight px-1 rounded ${isSelected ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                                {cleanName}
                             </span>
                             <button onClick={(e) => { e.stopPropagation(); deleteItem(cleanName); }} className="mt-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-full text-red-500"><Trash2 size={10} /></button>
                         </div>
                     );
                 })}
             </div>
        </div>
        
        {/* Status Bar */}
        <div className="h-6 bg-gray-100 border-t border-gray-200 px-3 flex items-center justify-between text-[10px] text-gray-500">
            <span>{status}</span>
            {currentPath.startsWith('/user/secure') && <span className="flex items-center gap-1 text-green-600 font-bold"><Shield size={10}/> ENCRYPTED VOLUME</span>}
            {currentPath.startsWith('/usb') && <span className="flex items-center gap-1 text-orange-600 font-bold"><Usb size={10}/> EXTERNAL DRIVE</span>}
        </div>
      </div>
    </div>
  );
};