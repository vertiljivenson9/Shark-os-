// Shark OS Runtime Manager
// Sistema para instalar y gestionar runtimes de lenguajes

import { kernelLog } from './KernelLogger';
import { systemEvents } from './EventBus';

export interface Runtime {
  id: string;
  name: string;
  version: string;
  size: string;
  installed: boolean;
  status: 'not-installed' | 'installing' | 'installed' | 'error';
  description: string;
  website: string;
  commands: string[];
}

const RUNTIMES: Runtime[] = [
  {
    id: 'python',
    name: 'Python',
    version: '3.11.0',
    size: '8.2 MB',
    installed: false,
    status: 'not-installed',
    description: 'Lenguaje de programación de alto nivel',
    website: 'https://python.org',
    commands: ['python', 'pip']
  },
  {
    id: 'node',
    name: 'Node.js',
    version: '18.0.0',
    size: '12.5 MB',
    installed: false,
    status: 'not-installed',
    description: 'Runtime de JavaScript para servidor',
    website: 'https://nodejs.org',
    commands: ['node', 'npm']
  },
  {
    id: 'lua',
    name: 'Lua',
    version: '5.4.4',
    size: '1.2 MB',
    installed: false,
    status: 'not-installed',
    description: 'Lenguaje de scripting ligero y rápido',
    website: 'https://lua.org',
    commands: ['lua']
  },
  {
    id: 'ruby',
    name: 'Ruby',
    version: '3.2.0',
    size: '6.8 MB',
    installed: false,
    status: 'not-installed',
    description: 'Lenguaje dinámico y orientado a objetos',
    website: 'https://ruby-lang.org',
    commands: ['ruby', 'gem']
  },
  {
    id: 'deno',
    name: 'Deno',
    version: '1.35.0',
    size: '15.2 MB',
    installed: false,
    status: 'not-installed',
    description: 'Runtime moderno de TypeScript/JavaScript',
    website: 'https://deno.land',
    commands: ['deno']
  },
  {
    id: 'bun',
    name: 'Bun',
    version: '1.0.0',
    size: '18.5 MB',
    installed: false,
    status: 'not-installed',
    description: 'Runtime ultra-rápido de JavaScript',
    website: 'https://bun.sh',
    commands: ['bun']
  }
];

type ProgressCallback = (progress: number, message: string) => void;

class RuntimeManager {
  private runtimes: Map<string, Runtime> = new Map();
  private onProgress: ProgressCallback | null = null;

  constructor() {
    RUNTIMES.forEach(r => this.runtimes.set(r.id, { ...r }));
    this.loadState();
  }

  private async loadState() {
    // Load installed runtimes from registry
    const installed = await this.getInstalledFromRegistry();
    installed.forEach(id => {
      const runtime = this.runtimes.get(id);
      if (runtime) {
        runtime.installed = true;
        runtime.status = 'installed';
      }
    });
  }

  private async getInstalledFromRegistry(): Promise<string[]> {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('shark-runtimes');
        return saved ? JSON.parse(saved) : [];
      }
    } catch {}
    return [];
  }

  private async saveState() {
    const installed = Array.from(this.runtimes.values())
      .filter(r => r.installed)
      .map(r => r.id);
    
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('shark-runtimes', JSON.stringify(installed));
      }
    } catch {}
  }

  setProgressCallback(callback: ProgressCallback): void {
    this.onProgress = callback;
  }

  // Get available runtimes
  getAvailable(): Runtime[] {
    return Array.from(this.runtimes.values());
  }

  // Get installed runtimes
  getInstalled(): Runtime[] {
    return Array.from(this.runtimes.values()).filter(r => r.installed);
  }

  // Get specific runtime
  getRuntime(id: string): Runtime | undefined {
    return this.runtimes.get(id);
  }

  // Install a runtime
  async install(id: string): Promise<{ success: boolean; message: string }> {
    const runtime = this.runtimes.get(id);
    if (!runtime) {
      return { success: false, message: `Runtime '${id}' not found` };
    }

    if (runtime.installed) {
      return { success: true, message: `${runtime.name} is already installed` };
    }

    // Start installation
    runtime.status = 'installing';
    kernelLog.info('runtime', `Installing ${runtime.name}...`);

    // Simulate installation with progress
    const steps = [
      { progress: 10, message: `Resolving package...` },
      { progress: 25, message: `Downloading ${runtime.name} (${runtime.size})...` },
      { progress: 50, message: `Verifying download...` },
      { progress: 70, message: `Extracting files...` },
      { progress: 85, message: `Registering runtime...` },
      { progress: 95, message: `Configuring environment...` },
      { progress: 100, message: `✔ ${runtime.name} installed successfully` }
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
      if (this.onProgress) {
        this.onProgress(step.progress, step.message);
      }
    }

    // Complete installation
    runtime.installed = true;
    runtime.status = 'installed';
    
    await this.saveState();
    
    kernelLog.info('runtime', `${runtime.name} v${runtime.version} installed`);
    systemEvents.runtimeInstall(runtime.name, runtime.version);

    return { success: true, message: `${runtime.name} v${runtime.version} installed successfully` };
  }

  // Uninstall a runtime
  async uninstall(id: string): Promise<{ success: boolean; message: string }> {
    const runtime = this.runtimes.get(id);
    if (!runtime) {
      return { success: false, message: `Runtime '${id}' not found` };
    }

    if (!runtime.installed) {
      return { success: false, message: `${runtime.name} is not installed` };
    }

    runtime.installed = false;
    runtime.status = 'not-installed';
    
    await this.saveState();
    
    kernelLog.info('runtime', `${runtime.name} uninstalled`);
    systemEvents.emit('runtime.uninstall', { runtime: runtime.name, version: runtime.version }, 'RuntimeManager');

    return { success: true, message: `${runtime.name} uninstalled successfully` };
  }

  // Execute code in a runtime
  async execute(runtimeId: string, code: string): Promise<{ success: boolean; output: string; error?: string }> {
    const runtime = this.runtimes.get(runtimeId);
    
    if (!runtime || !runtime.installed) {
      return { 
        success: false, 
        output: '', 
        error: `Runtime '${runtimeId}' is not installed. Run: shark install ${runtimeId}` 
      };
    }

    // Simulate execution (in a real implementation, this would use a Web Worker)
    kernelLog.info('runtime', `Executing ${runtime.name} code`, { codeLength: code.length });

    // Simulate output based on runtime
    const output = this.simulateExecution(runtimeId, code);
    
    return { success: true, output };
  }

  private simulateExecution(runtimeId: string, code: string): string {
    // Basic simulation of code execution
    switch (runtimeId) {
      case 'python':
        return this.simulatePython(code);
      case 'node':
        return this.simulateNode(code);
      case 'lua':
        return this.simulateLua(code);
      default:
        return `(Simulated ${runtimeId} output)\n${code}`;
    }
  }

  private simulatePython(code: string): string {
    if (code.includes('print(')) {
      const matches = code.match(/print\((.*?)\)/g);
      if (matches) {
        return matches.map(m => {
          const content = m.replace('print(', '').replace(')', '');
          return content.replace(/['"]/g, '');
        }).join('\n');
      }
    }
    return `Python 3.11.0 (simulated)\n>>> ${code}`;
  }

  private simulateNode(code: string): string {
    if (code.includes('console.log(')) {
      const matches = code.match(/console\.log\((.*?)\)/g);
      if (matches) {
        return matches.map(m => {
          const content = m.replace('console.log(', '').replace(')', '');
          return content.replace(/['"]/g, '');
        }).join('\n');
      }
    }
    return `Node.js v18.0.0 (simulated)\n> ${code}`;
  }

  private simulateLua(code: string): string {
    if (code.includes('print(')) {
      const matches = code.match(/print\((.*?)\)/g);
      if (matches) {
        return matches.map(m => {
          const content = m.replace('print(', '').replace(')', '');
          return content.replace(/['"]/g, '');
        }).join('\n');
      }
    }
    return `Lua 5.4.4 (simulated)\n> ${code}`;
  }

  // Get runtime commands for terminal
  getCommands(): string[] {
    return Array.from(this.runtimes.values())
      .filter(r => r.installed)
      .flatMap(r => r.commands);
  }

  // Check if a command is available
  hasCommand(cmd: string): boolean {
    return this.getCommands().includes(cmd);
  }
}

export const runtimeManager = new RuntimeManager();
