// Shark OS SDK v2.0 - Developer Kit
// API que se expone a las aplicaciones

declare global {
  interface Window {
    Shark: typeof SharkSDK;
  }
}

export interface SharkSDKAPI {
  // ==================== FILESYSTEM ====================
  fs: {
    /**
     * Leer archivo
     * @requires fs:read
     */
    read(path: string): Promise<string>;
    
    /**
     * Escribir archivo
     * @requires fs:write
     */
    write(path: string, data: string): Promise<void>;
    
    /**
     * Eliminar archivo
     * @requires fs:delete
     */
    delete(path: string): Promise<void>;
    
    /**
     * Listar directorio
     * @requires fs:read
     */
    list(path: string): Promise<string[]>;
    
    /**
     * Crear directorio
     * @requires fs:mkdir
     */
    mkdir(path: string): Promise<void>;
    
    /**
     * Verificar si existe
     */
    exists(path: string): Promise<boolean>;
    
    /**
     * Mostrar diálogo de abrir archivo
     */
    showOpenDialog(options?: FileDialogOptions): Promise<string[]>;
    
    /**
     * Mostrar diálogo de guardar
     */
    showSaveDialog(options?: FileDialogOptions): Promise<string>;
  };

  // ==================== NETWORK ====================
  net: {
    /**
     * Fetch con permisos
     * @requires net:fetch
     */
    fetch(url: string, options?: RequestInit): Promise<Response>;
    
    /**
     * WebSocket con permisos
     * @requires net:websocket
     */
    websocket(url: string): Promise<WebSocket>;
  };

  // ==================== MEDIA ====================
  media: {
    /**
     * Acceder a cámara
     * @requires media:camera
     */
    getCamera(): Promise<MediaStream>;
    
    /**
     * Acceder a micrófono
     * @requires media:microphone
     */
    getMicrophone(): Promise<MediaStream>;
    
    /**
     * Reproducir sonido
     */
    playSound(url: string): Promise<void>;
    
    /**
     * Text-to-speech
     */
    speak(text: string, lang?: string): Promise<void>;
  };

  // ==================== SYSTEM ====================
  system: {
    /**
     * Mostrar notificación
     * @requires sys:notifications
     */
    notify(title: string, body: string, options?: NotificationOptions): Promise<void>;
    
    /**
     * Copiar al portapapeles
     * @requires sys:clipboard
     */
    copyToClipboard(text: string): Promise<void>;
    
    /**
     * Pegar del portapapeles
     * @requires sys:clipboard
     */
    pasteFromClipboard(): Promise<string>;
    
    /**
     * Lanzar otra app
     * @requires sys:launch-app
     */
    launchApp(appId: string, args?: any): Promise<void>;
    
    /**
     * Cerrar esta app
     */
    close(): void;
    
    /**
     * Obtener información del sistema
     */
    getInfo(): SystemInfo;
    
    /**
     * Mantener pantalla encendida
     * @requires sys:wakelock
     */
    keepAwake(enabled: boolean): Promise<void>;
  };

  // ==================== IPC ====================
  ipc: {
    /**
     * Enviar mensaje a otra app
     */
    send(channel: string, message: any): void;
    
    /**
     * Escuchar mensajes
     */
    on(channel: string, handler: (message: any) => void): () => void;
    
    /**
     * Request-Response
     */
    request(channel: string, payload: any, timeout?: number): Promise<any>;
  };

  // ==================== STORAGE ====================
  storage: {
    /**
     * Guardar datos de la app
     */
    set(key: string, value: any): Promise<void>;
    
    /**
     * Obtener datos
     */
    get(key: string): Promise<any>;
    
    /**
     * Eliminar datos
     */
    remove(key: string): Promise<void>;
    
    /**
     * Limpiar todo
     */
    clear(): Promise<void>;
  };

  // ==================== UI ====================
  ui: {
    /**
     * Mostrar toast
     */
    toast(message: string, type?: 'info' | 'success' | 'error'): void;
    
    /**
     * Mostrar confirmación
     */
    confirm(title: string, message: string): Promise<boolean>;
    
    /**
     * Mostrar input
     */
    prompt(title: string, defaultValue?: string): Promise<string | null>;
    
    /**
     * Cambiar título de ventana
     */
    setTitle(title: string): void;
    
    /**
     * Cambiar tamaño de ventana
     */
    resize(width: number, height: number): void;
  };

  // ==================== UTILS ====================
  utils: {
    /**
     * Generar UUID
     */
    uuid(): string;
    
    /**
     * Formatear bytes
     */
    formatBytes(bytes: number): string;
    
    /**
     * Delay
     */
    sleep(ms: number): Promise<void>;
    
    /**
     * Debounce
     */
    debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T;
  };
}

export interface FileDialogOptions {
  filters?: { name: string; extensions: string[] }[];
  multiple?: boolean;
  defaultPath?: string;
}

export interface SystemInfo {
  version: string;
  platform: string;
  language: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isOffline: boolean;
  storageQuota: number;
  storageUsed: number;
}

// ==================== IMPLEMENTACIÓN ====================

export const SharkSDK: SharkSDKAPI = {
  fs: {
    async read(path: string): Promise<string> {
      const result = await window.parent.postMessage({ type: 'shark:fs:read', path }, '*');
      return result as string;
    },
    
    async write(path: string, data: string): Promise<void> {
      await window.parent.postMessage({ type: 'shark:fs:write', path, data }, '*');
    },
    
    async delete(path: string): Promise<void> {
      await window.parent.postMessage({ type: 'shark:fs:delete', path }, '*');
    },
    
    async list(path: string): Promise<string[]> {
      const result = await window.parent.postMessage({ type: 'shark:fs:list', path }, '*');
      return result as string[];
    },
    
    async mkdir(path: string): Promise<void> {
      await window.parent.postMessage({ type: 'shark:fs:mkdir', path }, '*');
    },
    
    async exists(path: string): Promise<boolean> {
      const result = await window.parent.postMessage({ type: 'shark:fs:exists', path }, '*');
      return result as boolean;
    },
    
    async showOpenDialog(options?: FileDialogOptions): Promise<string[]> {
      const result = await window.parent.postMessage({ type: 'shark:fs:openDialog', options }, '*');
      return result as string[];
    },
    
    async showSaveDialog(options?: FileDialogOptions): Promise<string> {
      const result = await window.parent.postMessage({ type: 'shark:fs:saveDialog', options }, '*');
      return result as string;
    }
  },

  net: {
    async fetch(url: string, options?: RequestInit): Promise<Response> {
      return fetch(url, options);
    },
    
    async websocket(url: string): Promise<WebSocket> {
      return new WebSocket(url);
    }
  },

  media: {
    async getCamera(): Promise<MediaStream> {
      return navigator.mediaDevices.getUserMedia({ video: true });
    },
    
    async getMicrophone(): Promise<MediaStream> {
      return navigator.mediaDevices.getUserMedia({ audio: true });
    },
    
    async playSound(url: string): Promise<void> {
      const audio = new Audio(url);
      await audio.play();
    },
    
    async speak(text: string, lang = 'es-ES'): Promise<void> {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      speechSynthesis.speak(utterance);
    }
  },

  system: {
    async notify(title: string, body: string, options?: NotificationOptions): Promise<void> {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, ...options });
      }
    },
    
    async copyToClipboard(text: string): Promise<void> {
      await navigator.clipboard.writeText(text);
    },
    
    async pasteFromClipboard(): Promise<string> {
      return await navigator.clipboard.readText();
    },
    
    async launchApp(appId: string, args?: any): Promise<void> {
      window.parent.postMessage({ type: 'shark:launch', appId, args }, '*');
    },
    
    close(): void {
      window.parent.postMessage({ type: 'shark:close' }, '*');
    },
    
    getInfo(): SystemInfo {
      return {
        version: '15.14.0',
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenWidth: screen.width,
        screenHeight: screen.height,
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        isOffline: !navigator.onLine,
        storageQuota: 0,
        storageUsed: 0
      };
    },
    
    async keepAwake(enabled: boolean): Promise<void> {
      if ('wakeLock' in navigator) {
        if (enabled) {
          await navigator.wakeLock.request('screen');
        }
      }
    }
  },

  ipc: {
    send(channel: string, message: any): void {
      window.parent.postMessage({ type: 'shark:ipc:send', channel, message }, '*');
    },
    
    on(channel: string, handler: (message: any) => void): () => void {
      const listener = (e: MessageEvent) => {
        if (e.data.type === `shark:ipc:${channel}`) {
          handler(e.data.message);
        }
      };
      window.addEventListener('message', listener);
      return () => window.removeEventListener('message', listener);
    },
    
    async request(channel: string, payload: any, timeout = 5000): Promise<any> {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        const timeoutId = setTimeout(() => reject(new Error('IPC timeout')), timeout);
        
        const listener = (e: MessageEvent) => {
          if (e.data.type === `shark:ipc:response` && e.data.id === id) {
            clearTimeout(timeoutId);
            window.removeEventListener('message', listener);
            resolve(e.data.result);
          }
        };
        
        window.addEventListener('message', listener);
        window.parent.postMessage({ type: 'shark:ipc:request', channel, payload, id }, '*');
      });
    }
  },

  storage: {
    async set(key: string, value: any): Promise<void> {
      localStorage.setItem(`shark_app_${key}`, JSON.stringify(value));
    },
    
    async get(key: string): Promise<any> {
      const data = localStorage.getItem(`shark_app_${key}`);
      return data ? JSON.parse(data) : null;
    },
    
    async remove(key: string): Promise<void> {
      localStorage.removeItem(`shark_app_${key}`);
    },
    
    async clear(): Promise<void> {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('shark_app_')) {
          localStorage.removeItem(key);
        }
      }
    }
  },

  ui: {
    toast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
      window.parent.postMessage({ type: 'shark:ui:toast', message, toastType: type }, '*');
    },
    
    async confirm(title: string, message: string): Promise<boolean> {
      return confirm(`${title}\n\n${message}`);
    },
    
    async prompt(title: string, defaultValue = ''): Promise<string | null> {
      return prompt(title, defaultValue);
    },
    
    setTitle(title: string): void {
      window.parent.postMessage({ type: 'shark:ui:setTitle', title }, '*');
    },
    
    resize(width: number, height: number): void {
      window.parent.postMessage({ type: 'shark:ui:resize', width, height }, '*');
    }
  },

  utils: {
    uuid(): string {
      return crypto.randomUUID();
    },
    
    formatBytes(bytes: number): string {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
      let timeoutId: ReturnType<typeof setTimeout>;
      return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), ms);
      }) as T;
    }
  }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
  window.Shark = SharkSDK;
}
