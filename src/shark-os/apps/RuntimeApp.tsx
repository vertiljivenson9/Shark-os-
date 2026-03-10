
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { kernel } from '../services/kernel';
import { AlertTriangle, Loader, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';

export const RuntimeApp: React.FC = () => {
  return <div className="p-4 text-white font-mono text-xs">Runtime Host System Online</div>;
};

export const RuntimeLoader: React.FC<{ appId: string }> = ({ appId }) => {
    const [srcUrl, setSrcUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 1. Preparar el contenido del Sandbox (Memoizado para evitar regeneraciones que "destruyen" la ventana)
    useEffect(() => {
        let active = true;
        
        const prepareSandbox = async () => {
            try {
                const srcPath = `/system/apps/${appId}.src`;
                if (!(await kernel.fs.exists(srcPath))) {
                    throw new Error(`Archivo fuente no encontrado: ${srcPath}`);
                }
                const rawSource = await kernel.fs.cat(srcPath);

                // El "ADN" del Sandbox: Inyectamos el Bridge de Shark OS
                const sandboxTemplate = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; overflow-x: hidden; }
                            * { box-sizing: border-box; }
                        </style>
                        <script>
                            // API segura para la App: SharkOS Bridge
                            window.shark = {
                                notify: (title, message) => {
                                    window.parent.postMessage({ type: 'SHARK_NOTIFY', appId: '${appId}', payload: { title, message } }, '*');
                                },
                                log: (msg) => {
                                    window.parent.postMessage({ type: 'SHARK_LOG', appId: '${appId}', payload: msg }, '*');
                                },
                                exit: () => {
                                    window.parent.postMessage({ type: 'SHARK_EXIT', appId: '${appId}' }, '*');
                                }
                            };
                            
                            // Captura de errores para la consola de Shark OS
                            window.onerror = (msg, url, line) => {
                                window.shark.log("Runtime Error: " + msg + " (L" + line + ")");
                                return false;
                            };
                        </script>
                    </head>
                    <body>
                        ${rawSource}
                    </body>
                    </html>
                `;

                const blob = new Blob([sandboxTemplate], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                
                if (active) {
                    setSrcUrl(url);
                    setIsLoading(false);
                }
            } catch (e: any) {
                if (active) {
                    setError(e.message);
                    setIsLoading(false);
                }
            }
        };

        prepareSandbox();

        return () => {
            active = false;
            if (srcUrl) URL.revokeObjectURL(srcUrl);
        };
    }, [appId]);

    // 2. Escucha de mensajes del Sandbox (Firewall)
    useEffect(() => {
        const bridgeListener = (event: MessageEvent) => {
            // Seguridad: Solo aceptar mensajes de nuestro propio origen (el blob)
            // Nota: Con sandbox sin 'allow-same-origin', origin es "null"
            if (event.data?.appId !== appId) return;

            const { type, payload } = event.data;
            switch (type) {
                case 'SHARK_NOTIFY':
                    kernel.notifications.push(payload.title, payload.message);
                    break;
                case 'SHARK_LOG':
                    console.log(`[App:${appId}]`, payload);
                    break;
                case 'SHARK_EXIT':
                    // El kernel debería cerrar la ventana aquí
                    break;
            }
        };

        window.addEventListener('message', bridgeListener);
        return () => window.removeEventListener('message', bridgeListener);
    }, [appId]);

    if (error) return (
        <div className="h-full flex flex-col items-center justify-center bg-[#020617] text-red-500 p-6 text-center">
            <ShieldAlert size={48} className="mb-4 animate-pulse"/>
            <h3 className="font-black uppercase tracking-tighter">Sandbox Violation or Load Error</h3>
            <p className="text-[10px] mt-2 text-gray-500 font-mono border border-red-500/20 p-2 rounded">{error}</p>
        </div>
    );

    if (isLoading) return (
        <div className="h-full flex flex-col items-center justify-center bg-[#020617]">
            <Loader className="animate-spin text-cyan-500 mb-2" />
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Inyectando Sandbox...</span>
        </div>
    );

    return (
        <div className="w-full h-full bg-black flex flex-col overflow-hidden">
            <div className="flex-1 relative">
                <iframe 
                    ref={iframeRef}
                    src={srcUrl!}
                    className="w-full h-full border-none bg-[#0f172a]"
                    title={`sandbox-${appId}`}
                    // AISLAMIENTO: No permitimos 'allow-same-origin' para que no pueda tocar el resto del OS
                    sandbox="allow-scripts allow-forms allow-popups" 
                />
            </div>
            
            {/* Barra de estado del Sandbox: No interfiere con la UI de la ventana */}
            <div className="h-6 bg-black border-t border-white/5 flex justify-between items-center px-3 select-none shrink-0">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={10} className="text-cyan-400" />
                    <span className="text-[8px] font-black text-cyan-400/70 uppercase tracking-tighter">
                        Isolated Environment Active
                    </span>
                </div>
                <div className="text-[8px] text-gray-600 font-mono">
                    SRC: {appId.toUpperCase()}
                </div>
            </div>
        </div>
    );
};
