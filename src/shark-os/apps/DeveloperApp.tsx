'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { kernel } from '../services/kernel';
import { toast } from '../components/Toast';
import { soundSystem } from '../services/media/SoundSystem';
import { 
  Code, Play, Package, Upload, Download, Terminal, FileCode, 
  Settings, Zap, CheckCircle, AlertCircle, Loader, Copy, 
  FolderOpen, Save, RefreshCw, ChevronRight, Info, BookOpen,
  Rocket, Shield, FileJson, Braces, Bug, TestTube
} from 'lucide-react';

interface ProjectFile {
  name: string;
  content: string;
  type: 'typescript' | 'javascript' | 'json' | 'css' | 'html';
}

interface DevProject {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  files: ProjectFile[];
  manifest: {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    permissions: string[];
    icon?: string;
  };
}

const DEFAULT_MANIFEST = `{
  "id": "com.myapp",
  "name": "Mi App",
  "version": "1.0.0",
  "author": "Developer",
  "description": "Una app increíble",
  "permissions": ["fs:read", "fs:write"],
  "icon": "🚀"
}`;

const DEFAULT_CODE = `// Shark OS App Template
import React from 'react';

export default function App() {
  return (
    <div className="p-4 bg-blue-500 text-white rounded-xl">
      <h1>¡Hola Shark OS!</h1>
      <p>Esta es mi primera app</p>
    </div>
  );
}`;

const SDK_DOCS = `
# Shark OS SDK v15.13

## Crear una App

\`\`\`typescript
import { shark } from 'shark-sdk';

// Sistema de archivos
const content = await shark.fs.read('/user/home/file.txt');
await shark.fs.write('/user/home/new.txt', 'contenido');

// Notificaciones
shark.notify('Título', 'Mensaje');

// Lanzar apps
shark.launch('terminal', { args: '--help' });
\`\`\`

## Permisos

- fs:read - Leer archivos
- fs:write - Escribir archivos  
- net:fetch - Acceso a internet
- media:camera - Usar cámara

## Empaquetado

\`\`\`bash
shark build --package
# Genera: mi-app.shark
\`\`\`
`;

export const DeveloperApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'manifest' | 'build' | 'docs'>('editor');
  const [project, setProject] = useState<DevProject>({
    id: crypto.randomUUID(),
    name: 'mi-app',
    version: '1.0.0',
    description: '',
    author: 'Developer',
    files: [
      { name: 'App.tsx', content: DEFAULT_CODE, type: 'typescript' },
      { name: 'manifest.json', content: DEFAULT_MANIFEST, type: 'json' }
    ],
    manifest: JSON.parse(DEFAULT_MANIFEST)
  });
  const [currentFile, setCurrentFile] = useState(0);
  const [building, setBuilding] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    '🦈 Shark OS Developer Console v15.13',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ''
  ]);
  const [testMode, setTestMode] = useState(false);

  const logConsole = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setConsoleOutput(prev => [...prev, `${prefix} ${msg}`]);
  };

  // Actualizar archivo actual
  const updateCurrentFile = (content: string) => {
    setProject(prev => ({
      ...prev,
      files: prev.files.map((f, i) => i === currentFile ? { ...f, content } : f)
    }));
  };

  // Parsear manifest
  useEffect(() => {
    try {
      const manifestFile = project.files.find(f => f.name === 'manifest.json');
      if (manifestFile) {
        const parsed = JSON.parse(manifestFile.content);
        setProject(prev => ({ ...prev, manifest: parsed }));
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }, [project.files]);

  // Build package
  const buildPackage = async () => {
    setBuilding(true);
    logConsole('Iniciando build...', 'info');
    
    soundSystem.play('click');
    
    // Simular proceso de build
    await new Promise(r => setTimeout(r, 500));
    logConsole('Validando manifest.json...', 'info');
    
    await new Promise(r => setTimeout(r, 300));
    try {
      const manifestFile = project.files.find(f => f.name === 'manifest.json');
      if (!manifestFile) throw new Error('manifest.json no encontrado');
      JSON.parse(manifestFile.content);
      logConsole('Manifest válido', 'success');
    } catch (e: any) {
      logConsole(`Error en manifest: ${e.message}`, 'error');
      setBuilding(false);
      soundSystem.play('error');
      return;
    }
    
    await new Promise(r => setTimeout(r, 400));
    logConsole('Compilando TypeScript...', 'info');
    
    await new Promise(r => setTimeout(r, 600));
    logConsole('Empaquetando recursos...', 'info');
    
    await new Promise(r => setTimeout(r, 400));
    logConsole('Generando .shark package...', 'info');
    
    // Crear package
    const pkgData = {
      manifest: project.manifest,
      files: project.files,
      buildTime: new Date().toISOString(),
      sharkVersion: '15.13'
    };
    
    // Guardar en VFS
    const pkgPath = `/user/home/apps/${project.manifest.id}.shark`;
    await kernel.fs.mkdir('/user/home/apps').catch(() => {});
    await kernel.fs.write(pkgPath, JSON.stringify(pkgData, null, 2));
    
    logConsole(`Package creado: ${pkgPath}`, 'success');
    logConsole('Build completado exitosamente!', 'success');
    
    setBuilding(false);
    soundSystem.play('success');
    toast.success('Build exitoso', `${project.manifest.name}.shark creado`);
  };

  // Test app
  const testApp = () => {
    setTestMode(true);
    soundSystem.play('open');
    logConsole('Iniciando app en modo prueba...', 'info');
    toast.info('Modo prueba', 'Ejecutando app en sandbox');
  };

  // Publicar a tienda
  const publishToStore = async () => {
    soundSystem.play('click');
    logConsole('Publicando a Shark Store...', 'info');
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Guardar en registry de apps instalables
    const installedApps = await kernel.registry.get('store.published') || [];
    installedApps.push({
      ...project.manifest,
      publishedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0
    });
    await kernel.registry.set('store.published', installedApps);
    
    logConsole('App publicada exitosamente!', 'success');
    soundSystem.play('success');
    toast.success('Publicada', 'Tu app está en la tienda');
  };

  // Nuevo archivo
  const addFile = () => {
    const name = prompt('Nombre del archivo:', 'Nuevo.tsx');
    if (!name) return;
    
    const type = name.endsWith('.tsx') || name.endsWith('.ts') ? 'typescript' 
      : name.endsWith('.js') ? 'javascript'
      : name.endsWith('.json') ? 'json'
      : name.endsWith('.css') ? 'css' : 'typescript';
    
    setProject(prev => ({
      ...prev,
      files: [...prev.files, { name, content: '', type }]
    }));
    setCurrentFile(project.files.length);
  };

  // Exportar proyecto
  const exportProject = () => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.shark-project`;
    a.click();
    URL.revokeObjectURL(url);
    soundSystem.play('download');
    toast.success('Exportado', 'Proyecto descargado');
  };

  return (
    <div className="h-full flex bg-[#0d1117] text-gray-200 font-mono text-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-48 bg-[#161b22] border-r border-gray-800 flex flex-col">
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <Code size={16} />
            <span className="text-xs uppercase tracking-wider">DevStudio</span>
          </div>
        </div>
        
        {/* Files */}
        <div className="flex-1 p-2 overflow-y-auto no-scrollbar">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2 px-2">Archivos</div>
          {project.files.map((file, i) => (
            <button
              key={i}
              onClick={() => setCurrentFile(i)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                currentFile === i ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              {file.type === 'typescript' ? <FileCode size={12} className="text-blue-400" /> 
               : file.type === 'json' ? <FileJson size={12} className="text-yellow-400" />
               : <FileCode size={12} className="text-gray-400" />}
              {file.name}
            </button>
          ))}
          <button 
            onClick={addFile}
            className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-500 hover:text-white hover:bg-gray-800 flex items-center gap-2 mt-1"
          >
            + Nuevo archivo
          </button>
        </div>
        
        {/* Actions */}
        <div className="p-2 border-t border-gray-800 space-y-1">
          <button 
            onClick={buildPackage}
            disabled={building}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {building ? <Loader size={12} className="animate-spin" /> : <Package size={12} />}
            {building ? 'Build...' : 'Build .shark'}
          </button>
          <button 
            onClick={testApp}
            className="w-full py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs font-bold flex items-center justify-center gap-2"
          >
            <Play size={12} /> Test App
          </button>
          <button 
            onClick={publishToStore}
            className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded text-xs font-bold flex items-center justify-center gap-2"
          >
            <Rocket size={12} /> Publicar
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-2 gap-1">
          {[
            { id: 'editor' as const, icon: Code, label: 'Editor' },
            { id: 'manifest' as const, icon: FileJson, label: 'Manifest' },
            { id: 'build' as const, icon: Package, label: 'Build' },
            { id: 'docs' as const, icon: BookOpen, label: 'Docs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === tab.id 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' && (
            <div className="h-full flex flex-col">
              {/* Code Editor */}
              <textarea
                value={project.files[currentFile]?.content || ''}
                onChange={e => updateCurrentFile(e.target.value)}
                className="flex-1 w-full p-4 bg-[#0d1117] text-gray-300 font-mono text-sm resize-none outline-none leading-relaxed"
                spellCheck={false}
                placeholder="// Escribe tu código aquí..."
              />
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="h-full p-4 overflow-y-auto">
              <div className="max-w-lg mx-auto space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileJson size={20} className="text-yellow-400" />
                  Configuración del Package
                </h2>
                
                <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 tracking-wider">ID del Package</label>
                    <input
                      type="text"
                      value={project.manifest.id}
                      onChange={e => {
                        const newManifest = { ...project.manifest, id: e.target.value };
                        setProject(prev => ({ ...prev, manifest: newManifest }));
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 tracking-wider">Nombre</label>
                    <input
                      type="text"
                      value={project.manifest.name}
                      onChange={e => {
                        const newManifest = { ...project.manifest, name: e.target.value };
                        setProject(prev => ({ ...prev, manifest: newManifest }));
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase text-gray-500 tracking-wider">Versión</label>
                      <input
                        type="text"
                        value={project.manifest.version}
                        onChange={e => {
                          const newManifest = { ...project.manifest, version: e.target.value };
                          setProject(prev => ({ ...prev, manifest: newManifest }));
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-500 tracking-wider">Autor</label>
                      <input
                        type="text"
                        value={project.manifest.author}
                        onChange={e => {
                          const newManifest = { ...project.manifest, author: e.target.value };
                          setProject(prev => ({ ...prev, manifest: newManifest }));
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 tracking-wider">Descripción</label>
                    <textarea
                      value={project.manifest.description}
                      onChange={e => {
                        const newManifest = { ...project.manifest, description: e.target.value };
                        setProject(prev => ({ ...prev, manifest: newManifest }));
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mt-1 h-20 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 tracking-wider">Permisos</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['fs:read', 'fs:write', 'net:fetch', 'media:camera', 'sys:notifications'].map(perm => (
                        <label key={perm} className="flex items-center gap-1.5 bg-gray-900 px-2 py-1 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={project.manifest.permissions?.includes(perm)}
                            onChange={e => {
                              const perms = project.manifest.permissions || [];
                              const newPerms = e.target.checked 
                                ? [...perms, perm]
                                : perms.filter(p => p !== perm);
                              setProject(prev => ({
                                ...prev,
                                manifest: { ...prev.manifest, permissions: newPerms }
                              }));
                            }}
                            className="accent-blue-500"
                          />
                          <span className="text-[10px]">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'build' && (
            <div className="h-full flex flex-col">
              {/* Console Output */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs bg-black/50">
                {consoleOutput.map((line, i) => (
                  <div key={i} className="leading-relaxed">{line}</div>
                ))}
              </div>
              
              {/* Actions */}
              <div className="p-3 bg-gray-900/50 border-t border-gray-800 flex gap-2">
                <button 
                  onClick={() => setConsoleOutput(['🦈 Console cleared', ''])}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs"
                >
                  Limpiar
                </button>
                <button 
                  onClick={exportProject}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs flex items-center gap-1"
                >
                  <Download size={12} /> Exportar Proyecto
                </button>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto prose prose-invert">
                <h1 className="text-2xl font-bold text-white mb-4">🦈 Shark OS SDK</h1>
                <div className="bg-gray-800/50 rounded-xl p-4 whitespace-pre-wrap text-xs font-mono text-gray-300">
                  {SDK_DOCS}
                </div>
                
                <div className="mt-6 space-y-4">
                  <h2 className="text-lg font-bold text-white">API Reference</h2>
                  
                  <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                    <div className="border-b border-gray-700 pb-2">
                      <code className="text-blue-400">shark.fs.read(path)</code>
                      <p className="text-xs text-gray-400 mt-1">Lee un archivo del sistema virtual</p>
                    </div>
                    <div className="border-b border-gray-700 pb-2">
                      <code className="text-blue-400">shark.fs.write(path, content)</code>
                      <p className="text-xs text-gray-400 mt-1">Escribe contenido a un archivo</p>
                    </div>
                    <div className="border-b border-gray-700 pb-2">
                      <code className="text-blue-400">shark.notify(title, message)</code>
                      <p className="text-xs text-gray-400 mt-1">Muestra una notificación del sistema</p>
                    </div>
                    <div>
                      <code className="text-blue-400">shark.launch(appId, args?)</code>
                      <p className="text-xs text-gray-400 mt-1">Lanza otra aplicación</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Mode Overlay */}
      {testMode && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">🧪 Modo Prueba</h3>
              <button 
                onClick={() => setTestMode(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="bg-white rounded-xl p-4 min-h-[200px]">
              <div className="text-center text-gray-500 text-sm">
                Preview de tu app...
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => setTestMode(false)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
              >
                Cerrar
              </button>
              <button 
                onClick={() => { buildPackage(); setTestMode(false); }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold"
              >
                Build
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
