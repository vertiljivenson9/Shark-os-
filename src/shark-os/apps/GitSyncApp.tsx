
import React, { useState } from 'react';
import { PROJECT_SOURCE } from '../data/project_source';
import { Zap, RefreshCw, Terminal, Trophy, Database } from 'lucide-react';

const REPO_OWNER = "vertiljivenson9"; 
const REPO_NAME = "Predator";
const DEFAULT_BRANCH = "main";

export const GitSyncApp: React.FC = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (m: string) => setLogs(p => [`[${new Date().toLocaleTimeString([], {hour12:false})}] ${m}`, ...p]);

  const robustBase64 = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return btoa(binary);
  };

  const replicate = async () => {
    if (!token.startsWith('ghp_')) {
      alert("Error: Master Token Inválido.");
      return;
    }

    setStatus('syncing');
    setLogs([]);
    addLog("⚛️ INICIANDO SECUENCIA PREDATOR v15.13...");
    addLog(`Cargando ${Object.keys(PROJECT_SOURCE).length} módulos en memoria...`);
    
    try {
      const headers = { 
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };
      const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

      addLog("Obteniendo SHA de referencia remota...");
      const refRes = await fetch(`${apiBase}/git/refs/heads/${DEFAULT_BRANCH}`, { headers });
      const refData = await refRes.json();
      const parentSha = refData.object.sha;

      const treeEntries = [];
      const entries = Object.entries(PROJECT_SOURCE);
      
      for (const [path, content] of entries) {
          const blobRes = await fetch(`${apiBase}/git/blobs`, {
              method: 'POST', headers,
              body: JSON.stringify({ content: robustBase64(content), encoding: 'base64' })
          });
          const blobData = await blobRes.json();
          treeEntries.push({ path: path.replace(/^\//, ""), mode: '100644', type: 'blob', sha: blobData.sha });
          addLog(`[SYNC] ${path} -> ${blobData.sha.substring(0,7)}`);
      }

      addLog("Construyendo árbol de sistema...");
      const treeRes = await fetch(`${apiBase}/git/trees`, { method: 'POST', headers, body: JSON.stringify({ tree: treeEntries }) });
      const treeData = await treeRes.json();

      addLog("Sellando commit atómico...");
      const commitRes = await fetch(`${apiBase}/git/commits`, {
        method: 'POST', headers,
        body: JSON.stringify({ message: `⚛️ SHARK_OS_v15.13: Full DNA Deployment`, tree: treeData.sha, parents: [parentSha] })
      });
      const commitData = await commitRes.json();

      addLog("Actualizando nodo maestro (PUSH)...");
      await fetch(`${apiBase}/git/refs/heads/${DEFAULT_BRANCH}`, {
        method: 'PATCH', headers, body: JSON.stringify({ sha: commitData.sha, force: true })
      });

      addLog("✅ REPLICACIÓN EXITOSA. El sistema es ahora real.");
      setStatus('done');

    } catch (e: any) {
      addLog("❌ FALLO CRÍTICO: " + e.message.toUpperCase());
      setStatus('idle');
    }
  };

  return (
    <div className="h-full bg-black text-indigo-400 font-mono flex flex-col select-none overflow-hidden">
      <div className="h-14 border-b border-indigo-900/30 flex items-center px-6 gap-3 bg-indigo-950/10">
        <Zap size={20} className="text-indigo-500 fill-indigo-500 animate-pulse" />
        <h1 className="text-xs font-black uppercase tracking-[0.4em]">Shark Replicator v15.13</h1>
      </div>
      <div className="flex-1 flex">
        <div className="w-1/2 p-10 flex flex-col justify-center items-center">
            {status === 'done' ? (
                <div className="text-center">
                    <Trophy size={80} className="text-indigo-300 mx-auto mb-6 drop-shadow-[0_0_20px_#4f46e5]" />
                    <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase italic">DNA_SYNCHRONIZED</h2>
                    <button onClick={() => setStatus('idle')} className="mt-8 px-10 py-3 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Reset Core</button>
                </div>
            ) : (
                <div className="w-full max-w-sm space-y-6">
                    <div className="bg-indigo-950/5 p-8 rounded-3xl border border-indigo-900/20 backdrop-blur-md">
                        <label className="text-[9px] font-black text-indigo-800 uppercase tracking-[0.2em]">Master Key</label>
                        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_XXXXXXXXXXXXXXXX" className="w-full bg-black/50 border border-indigo-900/40 p-4 rounded-2xl text-sm text-indigo-100 outline-none mt-2" />
                    </div>
                    <button onClick={replicate} disabled={status === 'syncing'} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/30 text-white rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl">
                        {status === 'syncing' ? <RefreshCw size={20} className="animate-spin" /> : <Database size={20} />}
                        {status === 'syncing' ? 'SYNCING_DNA...' : 'Launch Atomic Replicator'}
                    </button>
                </div>
            )}
        </div>
        <div className="w-1/2 bg-black/60 border-l border-indigo-900/10 flex flex-col">
            <div className="h-10 bg-indigo-950/20 border-b border-indigo-900/20 flex items-center px-6">
                <Terminal size={14} className="text-indigo-600 mr-3" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-800">Atomic_Monitor</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[9px] space-y-1.5 no-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className={`p-2 border-l-2 ${log.includes('ERROR') ? 'text-red-500 border-red-900 bg-red-950/10' : 'text-indigo-400 border-indigo-900/40'}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
