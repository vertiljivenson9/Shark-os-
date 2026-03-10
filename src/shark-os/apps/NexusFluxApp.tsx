import React, { useState, useEffect } from 'react';
import { PROJECT_SOURCE } from '../data/project_source';
import { Zap, Shield, Globe, Terminal, Lock, GitFork, RefreshCw, Cpu, Activity, CheckCircle2, AlertOctagon, Box, Database } from 'lucide-react';

interface FluxLog {
    id: string;
    msg: string;
    status: 'pending' | 'syncing' | 'done' | 'fail';
    path: string;
}

export const NexusFluxApp: React.FC = () => {
    const [token, setToken] = useState('');
    const [repo, setRepo] = useState('vertiljivenson9/Shark-desktop');
    const [branch, setBranch] = useState('main');
    const [isFluxing, setIsFluxing] = useState(false);
    const [logs, setLogs] = useState<FluxLog[]>([]);
    const [progress, setProgress] = useState(0);
    const [currentAction, setCurrentAction] = useState('IDLE');

    const addLog = (path: string, msg: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setLogs(prev => [{ id, path, msg, status: 'syncing' }, ...prev.slice(0, 49)]);
        return id;
    };

    const updateLog = (id: string, status: FluxLog['status'], msg?: string) => {
        setLogs(prev => prev.map(l => l.id === id ? { ...l, status, msg: msg || l.msg } : l));
    };

    // Nueva tecnología de conversión: ArrayBuffer a Base64 robusto
    const robustBase64 = (str: string) => {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const runFluxSync = async () => {
        if (!token) return alert("Nexus Flux requiere Token Master para abrir el canal.");
        
        setIsFluxing(true);
        setProgress(5);
        setCurrentAction('INITIALIZING_FLUX_CORE');

        try {
            const headers = {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            };
            const apiBase = `https://api.github.com/repos/${repo}`;

            // 1. Verificar Rama y obtener SHA Base
            const branchRes = await fetch(`${apiBase}/branches/${branch}`, { headers });
            if (!branchRes.ok) throw new Error("No se pudo conectar con el nodo remoto.");
            const branchData = await branchRes.json();
            const baseTreeSha = branchData.commit.commit.tree.sha;
            const parentSha = branchData.commit.sha;

            // 2. Preparar el DNA del sistema actualizado
            setCurrentAction('COMPILING_SYSTEM_DNA');
            const source = { ...PROJECT_SOURCE };
            
            // Re-generar el archivo project_source.ts para que el sistema sea autoportante
            let dna = 'export const PROJECT_SOURCE: Record<string, string> = {\n';
            Object.entries(PROJECT_SOURCE).forEach(([path, code]) => {
                const cleanPath = path.replace(/\\/g, '/').replace(/^\.?\//, '');
                const escaped = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
                dna += `  "${cleanPath}": \`${escaped}\`,\n`;
            });
            dna += '};\n';
            source['data/project_source.ts'] = dna;

            const entries = Object.entries(source);
            const treeItems: any[] = [];

            // 3. PROCESAMIENTO SECUENCIAL (Nueva Tech para evitar "Fallo en Blob")
            setCurrentAction('INJECTING_BLOBS_SEQUENTIALLY');
            let completed = 0;

            for (const [path, content] of entries) {
                const cleanPath = path.replace(/\\/g, '/').replace(/^\.?\//, '');
                const logId = addLog(cleanPath, `Transfiriendo bytes...`);
                
                let retryCount = 0;
                let success = false;
                let blobData;

                while (retryCount < 3 && !success) {
                    try {
                        const bRes = await fetch(`${apiBase}/git/blobs`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                content: robustBase64(content),
                                encoding: 'base64'
                            })
                        });

                        if (!bRes.ok) throw new Error("Rechazo de socket GitHub");
                        blobData = await bRes.json();
                        success = true;
                    } catch (e) {
                        retryCount++;
                        updateLog(logId, 'fail', `Reintento ${retryCount}/3...`);
                        await new Promise(r => setTimeout(r, 1000 * retryCount));
                    }
                }

                if (!success) throw new Error(`Fallo crítico tras 3 reintentos en: ${cleanPath}`);

                treeItems.push({
                    path: cleanPath,
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha
                });

                completed++;
                updateLog(logId, 'done', `SHA: ${blobData.sha.substring(0,8)}`);
                setProgress(5 + Math.floor((completed / entries.length) * 80));
            }

            // 4. Crear Árbol
            setCurrentAction('FINALIZING_TREE');
            const treeRes = await fetch(`${apiBase}/git/trees`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ tree: treeItems, base_tree: baseTreeSha })
            });
            const treeData = await treeRes.json();

            // 5. Crear Commit
            setCurrentAction('SEALING_COMMIT');
            const commitRes = await fetch(`${apiBase}/git/commits`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: `Nexus Flux Sinc: Build ${new Date().getTime()}`,
                    tree: treeData.sha,
                    parents: [parentSha]
                })
            });
            const commitData = await commitRes.json();

            // 6. Actualizar Referencia (Push)
            setCurrentAction('PUSHING_TO_REMOTE');
            await fetch(`${apiBase}/git/refs/heads/${branch}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ sha: commitData.sha, force: true })
            });

            setProgress(100);
            setCurrentAction('SYNCHRONIZED');
            addLog('SYSTEM', 'Canal de flujo cerrado con éxito.');

        } catch (e: any) {
            setCurrentAction('CORE_FAILURE');
            addLog('ERROR', e.message);
        } finally {
            setIsFluxing(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] text-[#e0e0e0] font-sans selection:bg-cyan-500/30">
            {/* Nexus Header */}
            <div className="h-14 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center px-6 justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-600 rounded shadow-[0_0_15px_rgba(8,145,178,0.4)] flex items-center justify-center">
                        <Zap size={18} className="text-white fill-white" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black tracking-[0.3em] uppercase">Nexus Flux</h1>
                        <p className="text-[9px] text-cyan-500 font-mono">STABLE_CHANNEL_V1.0</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10 text-[9px] font-mono">
                        <Shield size={10} className="text-green-500"/> SEQUENTIAL_STRICT
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10 text-[9px] font-mono">
                        <Globe size={10} className="text-blue-500"/> ATOMIC_PUSH_ON
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Control Reactor */}
                <div className="w-1/2 p-10 border-r border-white/5 flex flex-col justify-center items-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.05)_0%,transparent_70%)] pointer-events-none" />
                    
                    <div className="w-full max-w-sm space-y-8 z-10">
                        <div className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5 shadow-2xl">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Remote Access Token</label>
                                <div className="flex items-center gap-3 bg-black rounded-xl border border-white/10 p-4 focus-within:border-cyan-500/50 transition-all shadow-inner">
                                    <Lock size={16} className="text-gray-600" />
                                    <input 
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="GitHub Master Key"
                                        className="bg-transparent border-none outline-none text-sm w-full font-mono text-cyan-100"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Target Cluster</label>
                                <div className="flex items-center gap-3 bg-black rounded-xl border border-white/10 p-4 focus-within:border-cyan-500/50 transition-all shadow-inner">
                                    <GitFork size={16} className="text-gray-600" />
                                    <input 
                                        value={repo}
                                        onChange={(e) => setRepo(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm w-full font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={runFluxSync}
                            disabled={isFluxing}
                            className={`w-full py-6 rounded-2xl font-black text-sm tracking-[0.2em] uppercase transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 ${isFluxing ? 'bg-cyan-900/20 text-cyan-500 cursor-wait border border-cyan-500/20' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20'}`}
                        >
                            {isFluxing ? <RefreshCw size={20} className="animate-spin" /> : <Database size={20} />}
                            {isFluxing ? 'Synchronizing Flocks...' : 'Initiate Nexus Sync'}
                        </button>

                        <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                             <div className={`w-3 h-3 rounded-full ${isFluxing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`} />
                             <div className="flex-1">
                                 <p className="text-[10px] font-black text-gray-500 uppercase">Current Status</p>
                                 <p className="text-xs font-mono text-gray-300">{currentAction}</p>
                             </div>
                             <div className="text-xl font-black font-mono text-cyan-500">{progress}%</div>
                        </div>
                    </div>
                </div>

                {/* Flow Monitor */}
                <div className="w-1/2 bg-black flex flex-col border-l border-white/5">
                    <div className="h-10 bg-white/[0.02] border-b border-white/5 flex items-center px-4">
                        <Terminal size={14} className="text-cyan-500 mr-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Core_Stream_Monitor</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2">
                        {logs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                                <Cpu size={60} />
                                <p className="mt-4 uppercase tracking-[0.5em] font-black">Waiting_For_Flux</p>
                            </div>
                        )}
                        {logs.map(l => (
                            <div key={l.id} className="flex gap-4 p-3 bg-white/[0.01] rounded-lg border border-white/5 animate-in slide-in-from-right duration-300">
                                <div className="shrink-0">
                                    {l.status === 'syncing' && <RefreshCw size={12} className="animate-spin text-yellow-500" />}
                                    {l.status === 'done' && <CheckCircle2 size={12} className="text-green-500" />}
                                    {l.status === 'fail' && <AlertOctagon size={12} className="text-red-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-cyan-500 font-bold truncate">{l.path}</span>
                                        <span className={`px-1.5 rounded-[4px] font-black uppercase text-[8px] ${l.status === 'done' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{l.status}</span>
                                    </div>
                                    <p className="text-gray-500 text-[9px]">{l.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-1 bg-white/5">
                        <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
};