
import React, { useState } from 'react';
import { PROJECT_SOURCE } from '../data/project_source';
import JSZip from 'jszip';
import { Archive, Database, RefreshCw, Code2, CheckCircle2 } from 'lucide-react';

export const ZipExportApp: React.FC = () => {
    const [isZipping, setIsZipping] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDone, setIsDone] = useState(false);

    const downloadZip = async () => {
        setIsZipping(true);
        setIsDone(false);
        setProgress(0);
        
        const zip = new JSZip();
        const files = Object.entries(PROJECT_SOURCE);
        const total = files.length;

        // Inyectar cada archivo del DNA en el ZIP
        for (let i = 0; i < total; i++) {
            const [path, content] = files[i];
            const cleanPath = path.replace(/^\//, "");
            zip.file(cleanPath, content);
            
            // Simular latencia de empaquetado para UX
            if (i % 5 === 0) {
                setProgress(Math.round(((i + 1) / total) * 100));
                await new Promise(r => setTimeout(r, 50));
            }
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SharkOS_Predator_v15_21_MasterDNA.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        setProgress(100);
        setIsZipping(false);
        setIsDone(true);
    };

    return (
        <div className="h-full flex flex-col items-center justify-center bg-[#020617] text-white p-10 font-sans relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)] pointer-events-none" />
            
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border transition-all duration-500 ${isDone ? 'bg-green-600/10 border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]' : 'bg-blue-600/10 border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.1)]'}`}>
                {isDone ? (
                    <CheckCircle2 size={48} className="text-green-500 drop-shadow-[0_0_10px_#22c55e]" />
                ) : (
                    <Archive size={48} className="text-blue-500 drop-shadow-[0_0_10px_#3b82f6]" />
                )}
            </div>

            <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter relative z-10">Predator Master DNA</h2>
            <p className="text-gray-500 text-sm mb-12 text-center max-w-sm font-medium relative z-10">
                Sincronizando el repositorio físico para exportación atómica. Incluye 60 archivos mapeados 1x1.
            </p>

            <div className="w-full max-w-md relative z-10 space-y-6">
                {(isZipping || isDone) && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                {isDone ? 'Empaquetado Finalizado' : 'Compilando Nucleótidos...'}
                            </span>
                            <span className="text-xs font-mono font-bold">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[9px] text-gray-600 mt-4 font-mono uppercase truncate">
                            {isDone ? 'REPLICACIÓN_COMPLETA' : `SYNC_DNA: ${Object.keys(PROJECT_SOURCE).length} ARCHIVOS`}
                        </p>
                    </div>
                )}

                <button 
                    onClick={downloadZip} 
                    disabled={isZipping} 
                    className={`w-full px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 group ${isDone ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500'}`}
                >
                    {isZipping ? <RefreshCw className="animate-spin" /> : <Database className="group-hover:animate-bounce" />}
                    {isZipping ? 'Sincronizando...' : isDone ? 'Volver a Exportar' : 'Generar ZIP de Sistema'}
                </button>
            </div>

            <div className="mt-12 flex items-center gap-3 text-[9px] text-gray-700 font-mono uppercase tracking-[0.2em] relative z-10 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                <Code2 size={12} className="text-blue-900" /> 
                Shark_OS_Predator_v15.21_Atomic_DNA
            </div>
        </div>
    );
};
