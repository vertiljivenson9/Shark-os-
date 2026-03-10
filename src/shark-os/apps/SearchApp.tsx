import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowLeft, ArrowRight, RefreshCw, X, Plus, Globe, Lock, MoreHorizontal, Star } from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
  isLanding: boolean;
  favicon?: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
}

export const SearchApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { 
      id: 'tab-1', 
      title: 'New Tab', 
      url: '', 
      isLanding: true, 
      history: [], 
      historyIndex: -1,
      isLoading: false 
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [urlInput, setUrlInput] = useState('');
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  useEffect(() => {
    if (activeTab.isLanding) setUrlInput('');
    else setUrlInput(activeTab.url);
  }, [activeTabId, activeTab.url, activeTab.isLanding]);

  const createTab = () => {
    const newId = `tab-${Date.now()}`;
    setTabs(prev => [...prev, {
      id: newId,
      title: 'New Tab',
      url: '',
      isLanding: true,
      history: [],
      historyIndex: -1,
      isLoading: false
    }]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Don't close last tab, just reset it
      setTabs([{ 
        id: 'tab-1', 
        title: 'New Tab', 
        url: '', 
        isLanding: true, 
        history: [], 
        historyIndex: -1,
        isLoading: false 
      }]);
      setActiveTabId('tab-1');
      return;
    }

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    delete iframeRefs.current[id];
  };

  const navigate = (tabId: string, queryOrUrl: string) => {
    let target = queryOrUrl.trim();
    if (!target) return;

    // Search Logic vs URL Logic
    let isUrl = target.startsWith('http://') || target.startsWith('https://');
    if (!isUrl && target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`;
        isUrl = true;
    } else if (!isUrl) {
        target = `https://www.google.com/search?igu=1&q=${encodeURIComponent(target)}`;
    }

    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        const newHistory = [...t.history.slice(0, t.historyIndex + 1), target];
        return {
          ...t,
          url: target,
          title: isUrl ? target.replace('https://', '').split('/')[0] : queryOrUrl,
          isLanding: false,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: true
        };
      }
      return t;
    }));
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          const newIndex = t.historyIndex - 1;
          const newUrl = t.history[newIndex];
          return { ...t, historyIndex: newIndex, url: newUrl, isLoading: true };
        }
        return t;
      }));
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          const newIndex = t.historyIndex + 1;
          const newUrl = t.history[newIndex];
          return { ...t, historyIndex: newIndex, url: newUrl, isLoading: true };
        }
        return t;
      }));
    }
  };

  const handleRefresh = () => {
    const frame = iframeRefs.current[activeTabId];
    if (frame) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isLoading: true } : t));
      frame.src = activeTab.url;
    }
  };

  const handleIframeLoad = (id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isLoading: false } : t));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#111] font-sans overflow-hidden">
      
      {/* Tab Strip */}
      <div className="flex items-center bg-[#2b2b2b] px-2 pt-2 gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              group flex items-center min-w-[160px] max-w-[240px] h-9 px-3 rounded-t-lg text-xs transition-all cursor-default select-none
              ${activeTabId === tab.id ? 'bg-[#3c3c3c] text-white shadow-sm' : 'bg-transparent text-gray-400 hover:bg-[#333] hover:text-gray-200'}
            `}
          >
            <span className="flex-1 truncate mr-2">{tab.isLanding ? 'New Tab' : tab.title}</span>
            <button 
              onClick={(e) => closeTab(e, tab.id)}
              className="p-0.5 rounded-full hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button onClick={createTab} className="p-2 text-gray-400 hover:text-white hover:bg-[#3c3c3c] rounded-md transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="bg-[#3c3c3c] flex items-center p-2 gap-2 shadow-md z-20">
        <div className="flex items-center gap-1 text-gray-400">
           <button onClick={handleBack} disabled={activeTab.historyIndex <= 0} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30">
             <ArrowLeft size={16} />
           </button>
           <button onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30">
             <ArrowRight size={16} />
           </button>
           <button onClick={handleRefresh} className="p-1.5 rounded hover:bg-white/10">
             {activeTab.isLoading ? <X size={16} /> : <RefreshCw size={16} />}
           </button>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); navigate(activeTabId, urlInput); }}
          className="flex-1 bg-[#202020] rounded-full flex items-center px-4 py-1.5 border border-transparent focus-within:border-blue-500/50 focus-within:bg-black transition-all"
        >
          {activeTab.url.startsWith('https') ? <Lock size={12} className="text-green-500 mr-2"/> : <Globe size={12} className="text-gray-500 mr-2"/>}
          <input 
            className="flex-1 bg-transparent text-gray-200 text-sm outline-none placeholder-gray-600"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Search or enter web address"
          />
          <Star size={14} className="text-gray-600 hover:text-yellow-500 cursor-pointer transition-colors" />
        </form>

        <button className="p-1.5 text-gray-400 hover:bg-white/10 rounded">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-white">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`absolute inset-0 w-full h-full bg-[#1e1e1e] ${activeTabId === tab.id ? 'visible z-10' : 'invisible z-0'}`}
          >
            {tab.isLanding ? (
              // LANDING PAGE (Viscrosoft Jedge Ocean)
              <div 
                className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1478359844494-1092259d93e4?q=80&w=2600&auto=format&fit=crop)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6 -mt-20">
                  
                  {/* VJ LOGO */}
                  <div className="mb-12 relative group cursor-default">
                    <h1 className="text-[120px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-400 drop-shadow-2xl select-none" style={{ fontFamily: 'Arial, sans-serif' }}>
                      VJ
                    </h1>
                    <div className="absolute -bottom-2 right-2 text-xs font-bold text-white/80 tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Viscrosoft Jedge
                    </div>
                  </div>

                  {/* Search Bar */}
                  <form 
                     onSubmit={(e) => { e.preventDefault(); navigate(tab.id, urlInput); }}
                     className="w-full max-w-xl relative transform transition-all hover:scale-[1.02]"
                  >
                     <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-full shadow-2xl" />
                     <div className="relative flex items-center px-6 py-4 bg-white/90 rounded-full shadow-inner border border-white/50">
                        <Search className="text-blue-600 mr-4" size={24} />
                        <input 
                           autoFocus={activeTabId === tab.id}
                           value={urlInput}
                           onChange={(e) => setUrlInput(e.target.value)}
                           className="flex-1 bg-transparent text-xl text-gray-800 placeholder-gray-500 outline-none font-light"
                           placeholder="Search the web"
                        />
                     </div>
                  </form>

                  {/* Quick Links (Visual only) */}
                  <div className="mt-12 flex gap-8">
                     {['Outlook', 'GitHub', 'LinkedIn', 'News'].map(link => (
                       <div key={link} className="flex flex-col items-center gap-2 group cursor-pointer hover:-translate-y-1 transition-transform">
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
                            <span className="text-white font-bold text-lg">{link[0]}</span>
                          </div>
                          <span className="text-white/80 text-xs font-medium">{link}</span>
                       </div>
                     ))}
                  </div>

                </div>
                
                {/* Footer Info */}
                <div className="absolute bottom-6 right-6 text-white/40 text-[10px] font-mono">
                   Viscrosoft Jedge v99.0.1 • Powered by WebOS Kernel
                </div>
              </div>
            ) : (
              // BROWSER IFRAME
              <>
                 {tab.isLoading && (
                   <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-800 z-20">
                      <div className="h-full bg-blue-500 animate-[progress_2s_infinite_ease-in-out]" />
                   </div>
                 )}
                 <iframe 
                   ref={el => { iframeRefs.current[tab.id] = el; }}
                   src={tab.url}
                   className="w-full h-full border-none bg-white"
                   sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                   onLoad={() => handleIframeLoad(tab.id)}
                   title={`tab-${tab.id}`}
                 />
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes progress {
            0% { width: 0%; margin-left: 0; }
            50% { width: 50%; margin-left: 25%; }
            100% { width: 100%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
};