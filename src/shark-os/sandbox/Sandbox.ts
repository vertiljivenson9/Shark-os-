// Shark OS Sandbox - App Isolation via Web Workers
// Cada app corre en su propio Worker aislado

import { Capability, permissionManager, AppManifest } from '../security/Permissions';

const SANDBOX_WORKER_CODE = `
// Código que corre dentro del Web Worker (aislado del DOM)
const permissions = new Set<string>();

// API que se expone a la app
const SharkAPI = {
  fs: {
    read: async (path) => {
      if (!permissions.has('fs:read')) throw new Error('Permission denied: fs:read');
      return postToHost('fs:read', { path });
    },
    write: async (path, data) => {
      if (!permissions.has('fs:write')) throw new Error('Permission denied: fs:write');
      return postToHost('fs:write', { path, data });
    }
  },
  
  net: {
    fetch: async (url, options) => {
      if (!permissions.has('net:fetch')) throw new Error('Permission denied: net:fetch');
      return postToHost('net:fetch', { url, options });
    }
  },
  
  system: {
    notify: (title, body) => {
      if (!permissions.has('sys:notifications')) throw new Error('Permission denied');
      postToHost('sys:notify', { title, body });
    },
    
    launch: (appId, args) => {
      if (!permissions.has('sys:launch-app')) throw new Error('Permission denied');
      postToHost('sys:launch', { appId, args });
    }
  }
};

function postToHost(type, payload) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const handler = (e) => {
      if (e.data.id === id) {
        self.removeEventListener('message', handler);
        if (e.data.error) reject(new Error(e.data.error));
        else resolve(e.data.result);
      }
    };
    self.addEventListener('message', handler);
    self.postMessage({ id, type, payload });
  });
}

// Recibir mensajes del host
self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'init':
      payload.permissions.forEach(p => permissions.add(p));
      self.postMessage({ type: 'ready' });
      break;
      
    case 'execute':
      try {
        // Ejecutar código de la app
        const fn = new Function('Shark', payload.code);
        const result = fn(SharkAPI);
        self.postMessage({ type: 'result', result });
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
      break;
      
    case 'event':
      // Pasar eventos UI a la app
      self.postMessage({ type: 'event', event: payload });
      break;
  }
};
`;

export interface SandboxConfig {
  manifest: AppManifest;
  permissions: Capability[];
  memoryLimit: number;  // bytes
  cpuLimit: number;     // ms per second
}

export class AppSandbox {
  private worker: Worker | null = null;
  private appId: string;
  private config: SandboxConfig;
  private messageHandlers = new Map<string, (result: any) => void>();
  private memoryUsage = 0;
  private cpuUsage = 0;

  constructor(config: SandboxConfig) {
    this.appId = config.manifest.id;
    this.config = config;
  }

  async start(): Promise<void> {
    // Crear worker desde blob
    const blob = new Blob([SANDBOX_WORKER_CODE], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    // Manejar mensajes del worker
    this.worker.onmessage = (e) => {
      const { type, id, result, error } = e.data;
      
      if (type === 'ready') {
        console.log(`[Sandbox] ${this.appId} ready`);
      } else if (id && this.messageHandlers.has(id)) {
        const handler = this.messageHandlers.get(id)!;
        this.messageHandlers.delete(id);
        if (error) handler({ error });
        else handler(result);
      }
    };

    this.worker.onerror = (e) => {
      console.error(`[Sandbox] ${this.appId} error:`, e.message);
    };

    // Inicializar con permisos
    this.worker.postMessage({
      type: 'init',
      payload: {
        permissions: this.config.permissions
      }
    });
  }

  // Ejecutar código en el sandbox
  async execute(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Sandbox not started'));
        return;
      }

      const id = crypto.randomUUID();
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(id);
        reject(new Error('Execution timeout'));
      }, 10000);

      this.messageHandlers.set(id, (result) => {
        clearTimeout(timeout);
        if (result.error) reject(new Error(result.error));
        else resolve(result);
      });

      this.worker.postMessage({
        type: 'execute',
        payload: { code }
      });
    });
  }

  // Enviar evento UI al sandbox
  sendEvent(event: any): void {
    if (this.worker) {
      this.worker.postMessage({
        type: 'event',
        payload: event
      });
    }
  }

  // Verificar permiso antes de operación
  private async handlePermissionRequest(capability: Capability, operation: () => Promise<any>): Promise<any> {
    if (!permissionManager.hasPermission(this.appId, capability)) {
      throw new Error(`Permission denied: ${capability}`);
    }
    return operation();
  }

  // Obtener estadísticas del sandbox
  getStats() {
    return {
      appId: this.appId,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      status: this.worker ? 'running' : 'stopped'
    };
  }

  // Terminar sandbox
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageHandlers.clear();
  }
}

// Manager de sandboxes
export class SandboxManager {
  private sandboxes = new Map<string, AppSandbox>();

  async createSandbox(manifest: AppManifest): Promise<AppSandbox> {
    // Solicitar permisos
    const granted = await permissionManager.requestPermissions(
      manifest.id,
      manifest
    );

    const capabilities = granted 
      ? manifest.permissions.required.filter((_, i) => granted[i])
      : [];

    const sandbox = new AppSandbox({
      manifest,
      permissions: capabilities,
      memoryLimit: 128 * 1024 * 1024, // 128MB
      cpuLimit: 100 // 100ms/s
    });

    await sandbox.start();
    this.sandboxes.set(manifest.id, sandbox);
    
    return sandbox;
  }

  getSandbox(appId: string): AppSandbox | undefined {
    return this.sandboxes.get(appId);
  }

  killSandbox(appId: string): void {
    const sandbox = this.sandboxes.get(appId);
    if (sandbox) {
      sandbox.terminate();
      this.sandboxes.delete(appId);
    }
  }

  getAllStats() {
    return Array.from(this.sandboxes.values()).map(s => s.getStats());
  }
}

export const sandboxManager = new SandboxManager();
