import React, { useState, useEffect, useCallback } from 'react';
import { kernel } from '../services/kernel';
import { Download, Check, Package, Search, Star, Trash2, HardDrive, AlertTriangle, Layers, Grid, X, ExternalLink, Key, ShieldCheck, Lock, ShoppingCart } from 'lucide-react';
import { AppDefinition } from '../types';

interface StoreItem extends AppDefinition {
  desc: string;
  rating: number;
}

const DEFAULT_STORE_CONTENT: StoreItem[] = [
  { 
      id: 'tictactoe', 
      name: 'Tic Tac Toe', 
      desc: 'Classic X and O game for two players.', 
      icon: 'Grid', 
      component: 'TicTacToeApp',
      version: '1.0.0',
      rating: 4.5, 
      price: 0 
  },
  { 
      id: 'todo_mock', 
      name: 'Super Todo Pro', 
      desc: 'Boost productivity with this task manager.', 
      icon: 'CheckSquare', 
      component: 'EditorApp',
      version: '1.2.0',
      rating: 4.8, 
      price: 4.99,
      paymentUrl: 'https://buy.stripe.com/test_placeholder' 
  },
  { 
      id: 'editor_pro', 
      name: 'Code Editor X', 
      desc: 'Advanced IDE features for professionals.', 
      icon: 'Code', 
      component: 'EditorApp',
      version: '2.0.0',
      rating: 4.9, 
      price: 19.99,
      paymentUrl: 'https://gumroad.com/placeholder' 
  },
];

export const StoreApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'market' | 'library'>('market');
  const [storeContent, setStoreContent] = useState<StoreItem[]>(DEFAULT_STORE_CONTENT);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<AppDefinition[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modals
  const [uninstallTarget, setUninstallTarget] = useState<{id: string, name: string} | null>(null);
  const [activationTarget, setActivationTarget] = useState<StoreItem | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    refreshData();
    
    const handleUpdate = () => refreshData();
    window.addEventListener('sys-app-install', handleUpdate);
    window.addEventListener('sys-app-uninstall', handleUpdate);
    
    return () => {
        window.removeEventListener('sys-app-install', handleUpdate);
        window.removeEventListener('sys-app-uninstall', handleUpdate);
    };
  }, []);

  const refreshData = async () => {
      // 1. Get Installed Apps
      const ids = await kernel.registry.get('apps.installed') || [];
      setInstalledIds(ids);

      // 2. Get Purchased Licenses from Registry
      const purchases = await kernel.registry.get('user.store.purchases') || [];
      setPurchasedIds(purchases);

      // 3. Get Published Apps (From IDE)
      const published = await kernel.registry.get('store.published') || [];
      const publishedItems = published.map((p: AppDefinition) => ({
          ...p,
          desc: `Created by ${p.author || 'User'} via Viscro Studio.`,
          rating: 0.0 // New apps have no rating
      }));
      
      // Merge unique items
      const merged = [...DEFAULT_STORE_CONTENT];
      publishedItems.forEach((p: StoreItem) => {
          if (!merged.find(m => m.id === p.id)) {
              merged.push(p);
          }
      });
      setStoreContent(merged);

      // 4. Load full definitions for library view
      const defs: AppDefinition[] = [];
      for (const id of ids) {
          try {
              const content = await kernel.fs.cat(`/system/apps/${id}.json`);
              defs.push(JSON.parse(content));
          } catch (e) {}
      }
      setInstalledApps(defs);
  };

  const initiateAction = (item: StoreItem) => {
      const isInstalled = installedIds.includes(item.id);
      
      if (isInstalled) {
          kernel.launchApp(item.id);
          return;
      }

      // Check if Paid and Not Purchased
      const isPaid = (item.price || 0) > 0;
      const hasLicense = purchasedIds.includes(item.id);

      if (isPaid && !hasLicense) {
          setActivationTarget(item);
          setLicenseKey('');
          setActivationError(null);
      } else {
          // Free or Already Owned
          performInstall(item);
      }
  };

  const openPaymentLink = () => {
      if (activationTarget?.paymentUrl) {
          window.open(activationTarget.paymentUrl, '_blank');
      } else {
          // Fallback if developer forgot to set URL
          alert("Error: Developer has not configured a valid payment URL for this item.");
      }
  };

  const handleActivation = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activationTarget) return;
      
      setIsValidating(true);
      setActivationError(null);
      
      setTimeout(async () => {
          const key = licenseKey.trim().toUpperCase();
          const isValid = key.startsWith('SK-') && key.length > 5;

          if (isValid) {
              // 1. Record Purchase
              const currentPurchases = await kernel.registry.get('user.store.purchases') || [];
              const newPurchases = [...currentPurchases, activationTarget.id];
              await kernel.registry.set('user.store.purchases', newPurchases);
              if (kernel.registry.flush) await kernel.registry.flush();
              
              setPurchasedIds(newPurchases);
              
              // 2. Install
              setActivationTarget(null);
              performInstall(activationTarget);
          } else {
              setActivationError('Invalid License Key. Try "SK-12345" for demo.');
          }
          setIsValidating(false);
      }, 1500);
  };

  const performInstall = async (item: StoreItem) => {
      setProcessingId(item.id);
      try {
          await new Promise(r => setTimeout(r, 1000)); // Sim network
          
          // Special case for published apps (they might be in registry store but not physically in /system/store yet for pkg manager to find simply by ID if logic differs)
          // The Pkg manager currently installs by ID from a local map or logic. 
          // For IDE published apps, we need to inject the logic to write the manifest.
          // Since pkg manager writes manifest based on data passed, we can just call install.
          
          // However, Pkg Manager `install` method expects a target string.
          // If it's a "Published" app, the Pkg Manager might not know about it in its hardcoded `remoteRepo`.
          // We need to handle "Published" apps slightly differently or update PkgManager.
          // WORKAROUND: We will manually install here since we have the definition.
          
          await kernel.fs.write(`/system/apps/${item.id}.json`, JSON.stringify(item, null, 2));
          
          // Update Registry
          const installed = (await kernel.registry.get('apps.installed')) || [];
          if (!installed.includes(item.id)) {
             await kernel.registry.set('apps.installed', [...installed, item.id]);
          }
          if (kernel.registry.flush) await kernel.registry.flush();

          window.dispatchEvent(new CustomEvent('sys-app-install', { detail: item.id }));
      } catch (e: any) {
          alert(e.message);
      }
      setProcessingId(null);
  };

  const requestUninstall = (appId: string, appName: string) => {
      if (kernel.pkg.isSystemApp(appId)) return;
      setUninstallTarget({ id: appId, name: appName });
  };

  const confirmUninstall = async () => {
      if (!uninstallTarget) return;
      
      const targetId = uninstallTarget.id;
      setUninstallTarget(null);
      setProcessingId(targetId);

      try {
          await new Promise(r => setTimeout(r, 800));
          await kernel.pkg.uninstall(targetId);
      } catch (e: any) {
          alert(e.message);
      }
      setProcessingId(null);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans text-slate-800 relative">
       
       {/* --- ACTIVATION MODAL (Real Flow) --- */}
       {activationTarget && (
           <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col">
                   <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                       <div>
                           <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                               <Lock size={20} className="text-blue-600"/> Activate Product
                           </h3>
                           <p className="text-sm text-gray-500 mt-1">{activationTarget.name}</p>
                       </div>
                       <button onClick={() => setActivationTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                   </div>
                   
                   <div className="p-6 space-y-6">
                       {/* Step 1: Purchase */}
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                           <div className="flex justify-between items-center mb-2">
                               <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step 1: Purchase</span>
                               <span className="text-lg font-bold text-gray-900">${activationTarget.price}</span>
                           </div>
                           <p className="text-sm text-gray-600 mb-4">
                               Securely pay the developer directly.
                           </p>
                           <button 
                             onClick={openPaymentLink}
                             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                           >
                               <ExternalLink size={16} /> 
                               Pay via {activationTarget.paymentUrl ? new URL(activationTarget.paymentUrl).hostname : 'External Link'}
                           </button>
                           <p className="text-[10px] text-center text-gray-400 mt-2">Opens in new secure window</p>
                       </div>

                       {/* Step 2: Activate */}
                       <div>
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Step 2: Enter Key</span>
                           <form onSubmit={handleActivation} className="space-y-3">
                               <div className="relative">
                                   <Key className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                   <input 
                                     autoFocus
                                     value={licenseKey}
                                     onChange={(e) => setLicenseKey(e.target.value)}
                                     placeholder="XXXX-XXXX-XXXX-XXXX"
                                     className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono uppercase"
                                   />
                               </div>
                               {activationError && (
                                   <div className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                                       <AlertTriangle size={12}/> {activationError}
                                   </div>
                               )}
                               <button 
                                 type="submit" 
                                 disabled={!licenseKey || isValidating}
                                 className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                               >
                                   {isValidating ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <ShieldCheck size={18} />}
                                   {isValidating ? 'Verifying...' : 'Activate & Install'}
                               </button>
                           </form>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* --- UNINSTALL MODAL --- */}
       {uninstallTarget && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
               <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                     <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Uninstall App?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                     Are you sure you want to remove <strong>{uninstallTarget.name}</strong>? 
                     <br/>This action cannot be undone.
                  </p>
               </div>
               <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-100">
                  <button 
                    onClick={() => setUninstallTarget(null)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmUninstall}
                    className="flex-1 px-4 py-2.5 bg-red-600 rounded-xl text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all active:scale-95"
                  >
                    Uninstall
                  </button>
               </div>
            </div>
         </div>
       )}

       {/* Header */}
       <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
           <div className="p-4 flex items-center justify-between">
               <h1 className="text-xl font-bold flex items-center gap-2">
                   <Package className="text-blue-600" /> App Center
               </h1>
               <div className="flex bg-slate-100 rounded-lg p-1">
                   <button 
                     onClick={() => setActiveTab('market')}
                     className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'market' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                   >
                       Store
                   </button>
                   <button 
                     onClick={() => setActiveTab('library')}
                     className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'library' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                   >
                       Library
                   </button>
               </div>
           </div>
           
           {activeTab === 'market' && (
             <div className="px-4 pb-4">
               <div className="relative">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      className="w-full bg-slate-100 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Search apps, games, tools..."
                   />
               </div>
             </div>
           )}
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto px-4 pb-4">
           
           {/* MARKETPLACE VIEW */}
           {activeTab === 'market' && (
               <div className="space-y-4 pt-4">
                   <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">All Apps</h3>
                   {storeContent.map(item => {
                       const isInstalled = installedIds.includes(item.id);
                       const isBusy = processingId === item.id;
                       const isOwned = purchasedIds.includes(item.id);
                       const isPaid = (item.price || 0) > 0;

                       return (
                           <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.01]">
                               <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                   <Grid size={24} />
                               </div>
                               <div className="flex-1 min-w-0">
                                   <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                   <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                                   <div className="flex items-center gap-3 mt-1">
                                       <div className="flex items-center gap-1">
                                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                            <span className="text-[10px] font-bold text-slate-400">{item.rating || 'N/A'}</span>
                                       </div>
                                       {isPaid && (
                                           <span className={`text-[10px] px-1.5 rounded font-bold border ${isOwned ? 'text-green-600 border-green-200 bg-green-50' : 'text-blue-600 border-blue-200 bg-blue-50'}`}>
                                               {isOwned ? 'OWNED' : `$${item.price}`}
                                           </span>
                                       )}
                                       {item.author && <span className="text-[10px] text-gray-400">by {item.author}</span>}
                                   </div>
                               </div>
                               <button 
                                  disabled={isInstalled || isBusy}
                                  onClick={() => initiateAction(item)}
                                  className={`
                                    px-4 py-1.5 rounded-full text-xs font-bold transition-all min-w-[70px] flex justify-center items-center
                                    ${isInstalled 
                                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                                    }
                                  `}
                               >
                                   {isBusy ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : isInstalled ? 'Open' : (isPaid && !isOwned ? `Buy` : 'Get')}
                               </button>
                           </div>
                       );
                   })}
               </div>
           )}

           {/* LIBRARY VIEW */}
           {activeTab === 'library' && (
               <div className="space-y-3 pt-4">
                   <div className="flex items-center gap-2 mb-4 text-slate-500 bg-slate-100 p-2 rounded-lg text-xs">
                        <HardDrive size={14} />
                        <span>{installedApps.length} Applications installed.</span>
                   </div>

                   {installedApps.map(app => {
                       const isSystem = kernel.pkg.isSystemApp(app.id);
                       const isBusy = processingId === app.id;

                       return (
                           <div key={app.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSystem ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-500'}`}>
                                    {isSystem ? <Layers size={20} /> : <Package size={20} />}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2">
                                       <h4 className="font-bold text-sm truncate">{app.name}</h4>
                                       {isSystem && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200">SYSTEM</span>}
                                   </div>
                                   <p className="text-[10px] text-slate-400 font-mono">{app.id} • v{app.version}</p>
                               </div>
                               
                               {!isSystem && (
                                   <button 
                                      onClick={() => requestUninstall(app.id, app.name)}
                                      disabled={isBusy}
                                      className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors group"
                                      title="Uninstall Application"
                                   >
                                       {isBusy ? (
                                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin text-red-500"/>
                                       ) : (
                                          <Trash2 size={18} className="group-active:scale-90 transition-transform" />
                                       )}
                                   </button>
                               )}
                           </div>
                       );
                   })}
                   
                   {installedApps.length === 0 && (
                       <div className="text-center py-10 text-slate-400">
                           <Package size={48} className="mx-auto mb-2 opacity-20" />
                           <p className="text-sm">No apps found.</p>
                       </div>
                   )}
               </div>
           )}

       </div>
    </div>
  );
};