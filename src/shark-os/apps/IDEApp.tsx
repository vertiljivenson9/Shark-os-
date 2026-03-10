import React, { useState, useEffect } from 'react';
import { kernel } from '../services/kernel';
import { Play, Save, Package, Settings, Code, FileJson, Layers, Download, UploadCloud, X, CheckCircle, Terminal as TermIcon, DollarSign, CreditCard, Globe, ShieldCheck } from 'lucide-react';
import { AppDefinition } from '../types';

const DEFAULT_CODE = `<!-- Welcome to WebOS Studio -->
<div class="container">
  <h1>Hello World!</h1>
  <p>This is my first WebOS App.</p>
  <button onclick="alert('It works!')">Click Me</button>
</div>

<style>
  .container {
    padding: 20px;
    text-align: center;
    color: white;
    font-family: sans-serif;
  }
  h1 { color: #3b82f6; }
  button {
    background: #3b82f6;
    border: none;
    padding: 10px 20px;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 20px;
  }
  button:hover { background: #2563eb; }
</style>
`;

export const IDEApp: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [config, setConfig] = useState<AppDefinition>({
    name: 'MyApp',
    id: 'com.user.myapp',
    icon: 'Cpu',
    version: '1.0.0',
    component: 'RuntimeApp',
    author: 'User',
    price: 0,
    paymentUrl: ''
  });
  
  const [activeTab, setActiveTab] = useState<'code' | 'config'>('code');
  
  // Build State
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'done'>('idle');
  const [builtPath, setBuiltPath] = useState('');
  
  // Publish State
  const [isPublishing, setIsPublishing] = useState(false); // Controls the "Distribution Settings" view
  const [publishStep, setPublishStep] = useState<'config' | 'uploading' | 'success'>('config');

  const handleBuild = async () => {
    setBuildStatus('building');
    setShowBuildModal(true);
    setIsPublishing(false); // Reset publish flow

    // Simulate compilation time
    await new Promise(r => setTimeout(r, 2000));

    try {
      // 1. Create Package Structure (.vpx)
      const packageData = {
        manifest: config,
        source: code,
        meta: {
          built: Date.now(),
          author: config.author
        }
      };

      // 2. Write to dist folder
      const distDir = '/user/home/dist';
      if (!(await kernel.fs.exists(distDir))) await kernel.fs.mkdir(distDir);
      
      const filename = `${config.id}.vpx`;
      const fullPath = `${distDir}/${filename}`;
      
      await kernel.fs.write(fullPath, JSON.stringify(packageData, null, 2));
      
      setBuiltPath(fullPath);
      setBuildStatus('done');
      kernel.notifications.push('Build Successful', `Package saved to ${fullPath}`);

    } catch (e: any) {
      kernel.notifications.push('Build Failed', e.message, true);
      setShowBuildModal(false);
      setBuildStatus('idle');
    }
  };

  const handleInstallLocal = async () => {
    try {
      await kernel.pkg.installVPX(builtPath);
      kernel.notifications.push('App Installed', `${config.name} is now available on your desktop.`);
      setShowBuildModal(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const startPublishFlow = () => {
      setIsPublishing(true);
      setPublishStep('config');
  };

  const finalizePublish = async () => {
    setPublishStep('uploading');
    
    // Slight delay to simulate upload
    await new Promise(r => setTimeout(r, 1500));

    try {
        const publishedApps = await kernel.registry.get('store.published') || [];
        const newPublished = publishedApps.filter((a: AppDefinition) => a.id !== config.id);
        
        // Push current config (which now includes monetization settings)
        newPublished.push(config);
        
        await kernel.registry.set('store.published', newPublished);
        if (kernel.registry.flush) await kernel.registry.flush();

        setPublishStep('success');
        kernel.notifications.push('Upload Complete', 'Your app is now live in the App Store.');

    } catch (e: any) {
        alert("Publish Failed: " + e.message);
        setPublishStep('config');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-300 font-sans">
      {/* Toolbar */}
      <div className="h-12 bg-[#252526] border-b border-black flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-400 font-bold mr-4">
            <Code size={20} />
            <span>Viscro Studio</span>
          </div>
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${activeTab === 'code' ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'}`}
          >
            <FileJson size={14} /> Source
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${activeTab === 'config' ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'}`}
          >
            <Settings size={14} /> Manifest
          </button>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={handleBuild}
             className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
           >
             <Play size={14} /> Build & Run
           </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'code' ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-sm resize-none outline-none leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full pb-20">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Project Configuration</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">App Name</label>
                  <input 
                    value={config.name}
                    onChange={(e) => setConfig({...config, name: e.target.value})}
                    className="w-full bg-[#3c3c3c] border border-black rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Package ID</label>
                  <input 
                    value={config.id}
                    onChange={(e) => setConfig({...config, id: e.target.value})}
                    className="w-full bg-[#3c3c3c] border border-black rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Version</label>
                  <input 
                    value={config.version}
                    onChange={(e) => setConfig({...config, version: e.target.value})}
                    className="w-full bg-[#3c3c3c] border border-black rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Icon Key (Lucide)</label>
                  <select 
                    value={config.icon}
                    onChange={(e) => setConfig({...config, icon: e.target.value})}
                    className="w-full bg-[#3c3c3c] border border-black rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                     {['Cpu', 'Terminal', 'Zap', 'Activity', 'Box', 'Code', 'Coffee', 'Database', 'Globe', 'Layers', 'Layout', 'Grid', 'CheckSquare'].map(i => (
                       <option key={i} value={i}>{i}</option>
                     ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-200">
               <strong className="block mb-1">Note on Distribution:</strong>
               Monetization and pricing settings will be available when you click <b>"Upload to Store"</b> after a successful build.
            </div>
          </div>
        )}
      </div>

      {/* Build / Publish Modal */}
      {showBuildModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
           <div className="bg-[#252526] w-[500px] rounded-xl shadow-2xl border border-[#454545] overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="h-12 bg-[#333333] flex items-center justify-between px-4 border-b border-black shrink-0">
                 <span className="font-bold text-white flex items-center gap-2">
                    {isPublishing ? <Globe size={16} className="text-purple-500"/> : <Package size={16} className="text-blue-500"/>} 
                    {isPublishing ? 'Store Distribution' : 'Build Manager'}
                 </span>
                 <button onClick={() => { setShowBuildModal(false); setBuildStatus('idle'); setIsPublishing(false); }}><X size={18} className="hover:text-white"/></button>
              </div>
              
              <div className="p-8 flex flex-col items-center text-center overflow-y-auto">
                 
                 {/* STATE: BUILDING */}
                 {!isPublishing && buildStatus === 'building' && (
                    <>
                       <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                       <h3 className="text-xl font-bold text-white mb-2">Compiling Assets...</h3>
                       <p className="text-gray-400 text-sm">Transpiling source to Virtual Executable format.</p>
                    </>
                 )}

                 {/* STATE: BUILD SUCCESS */}
                 {!isPublishing && buildStatus === 'done' && (
                    <>
                       <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 border border-green-500/50">
                          <CheckCircle size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2">Build Successful!</h3>
                       <p className="text-gray-400 text-sm mb-8 px-8">
                          Package <strong>{config.id}.vpx</strong> has been generated in <code>/user/home/dist</code>.
                       </p>

                       <div className="flex gap-4 w-full">
                          <button 
                            onClick={handleInstallLocal}
                            className="flex-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] border border-black p-4 rounded-lg flex flex-col items-center gap-2 transition-colors group"
                          >
                             <Download size={24} className="text-blue-400 group-hover:scale-110 transition-transform"/>
                             <div className="text-sm font-bold text-white">Install to Desktop</div>
                             <div className="text-[10px] text-gray-500">Local Deployment</div>
                          </button>

                          <button 
                            onClick={startPublishFlow}
                            className="flex-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] border border-black p-4 rounded-lg flex flex-col items-center gap-2 transition-colors group"
                          >
                             <UploadCloud size={24} className="text-purple-400 group-hover:scale-110 transition-transform"/>
                             <div className="text-sm font-bold text-white">Upload to Store</div>
                             <div className="text-[10px] text-gray-500">Public Distribution</div>
                          </button>
                       </div>
                    </>
                 )}

                 {/* STATE: PUBLISHING CONFIGURATION */}
                 {isPublishing && publishStep === 'config' && (
                     <div className="w-full text-left animate-in slide-in-from-right duration-300">
                         <h3 className="text-lg font-bold text-white mb-1">Distribution Settings</h3>
                         <p className="text-sm text-gray-400 mb-6">Configure how users will access your app.</p>

                         {/* Free vs Paid Toggle */}
                         <div className="flex bg-black rounded-lg p-1 mb-6 border border-[#404040]">
                             <button 
                               onClick={() => setConfig({...config, price: 0})}
                               className={`flex-1 py-2 rounded text-sm font-bold transition-all ${(!config.price || config.price === 0) ? 'bg-[#3c3c3c] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                                 Free App
                             </button>
                             <button 
                               onClick={() => setConfig({...config, price: 4.99})}
                               className={`flex-1 py-2 rounded text-sm font-bold transition-all ${(config.price || 0) > 0 ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                                 Paid App
                             </button>
                         </div>

                         {/* Paid Inputs */}
                         {(config.price || 0) > 0 && (
                             <div className="space-y-4 mb-6 bg-[#2d2d2d] p-4 rounded-lg border border-[#404040] animate-in fade-in zoom-in-95 duration-200">
                                 <div>
                                     <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Listing Price ($)</label>
                                     <div className="relative">
                                         <DollarSign className="absolute left-3 top-2.5 text-gray-500" size={14} />
                                         <input 
                                           type="number"
                                           min="0.99"
                                           step="0.01"
                                           value={config.price}
                                           onChange={(e) => setConfig({...config, price: parseFloat(e.target.value)})}
                                           className="w-full pl-9 bg-[#1e1e1e] border border-black rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                         />
                                     </div>
                                 </div>
                                 
                                 <div>
                                     <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Payment Link (Stripe/PayPal)</label>
                                     <div className="relative">
                                         <CreditCard className="absolute left-3 top-2.5 text-gray-500" size={14} />
                                         <input 
                                           value={config.paymentUrl || ''}
                                           onChange={(e) => setConfig({...config, paymentUrl: e.target.value})}
                                           placeholder="https://buy.stripe.com/..."
                                           className="w-full pl-9 bg-[#1e1e1e] border border-black rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                         />
                                     </div>
                                     <p className="text-[10px] text-gray-500 mt-1">Users will be redirected here to purchase the license key.</p>
                                 </div>
                             </div>
                         )}

                         <div className="flex gap-3 mt-4">
                             <button onClick={() => setIsPublishing(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Back</button>
                             <button 
                               onClick={finalizePublish}
                               disabled={(config.price || 0) > 0 && !config.paymentUrl}
                               className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                             >
                                 <UploadCloud size={18} /> Publish Now
                             </button>
                         </div>
                     </div>
                 )}

                 {/* STATE: UPLOADING */}
                 {isPublishing && publishStep === 'uploading' && (
                     <>
                        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold text-white mb-2">Publishing...</h3>
                        <p className="text-gray-400 text-sm">Registering {config.id} in ViscroStore.</p>
                     </>
                 )}

                 {/* STATE: SUCCESS */}
                 {isPublishing && publishStep === 'success' && (
                     <>
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 text-purple-400 border border-purple-500/50">
                           <Globe size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">App Published!</h3>
                        <p className="text-gray-400 text-sm mb-8 px-8">
                           <strong>{config.name}</strong> is now available for download.
                           {(config.price || 0) > 0 && <span className="block mt-2 text-green-400">Monetization Active: ${config.price}</span>}
                        </p>
                        <button onClick={() => { setShowBuildModal(false); setBuildStatus('idle'); }} className="bg-[#3c3c3c] hover:bg-[#4c4c4c] border border-black px-6 py-2 rounded text-white text-sm font-bold">
                            Close
                        </button>
                     </>
                 )}

              </div>
           </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="h-6 bg-[#007acc] text-white text-[10px] flex items-center px-2 gap-4 select-none">
        <span className="flex items-center gap-1"><TermIcon size={10} /> Ready</span>
        <span>Ln 1, Col 1</span>
        <span>UTF-8</span>
        <span className="ml-auto">{config.id} {config.price ? `($${config.price})` : '(Free)'}</span>
      </div>
    </div>
  );
};