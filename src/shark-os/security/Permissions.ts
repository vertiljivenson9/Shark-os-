// Shark OS Security - Capability-based Permissions System
// Similar a Android/iOS permissions model

export enum Capability {
  // Filesystem
  FS_READ = 'fs:read',
  FS_WRITE = 'fs:write',
  FS_DELETE = 'fs:delete',
  FS_MKDIR = 'fs:mkdir',
  
  // Network
  NET_FETCH = 'net:fetch',
  NET_WEBSOCKET = 'net:websocket',
  NET_DNS = 'net:dns',
  
  // Media
  MEDIA_CAMERA = 'media:camera',
  MEDIA_MICROPHONE = 'media:microphone',
  MEDIA_SPEAKER = 'media:speaker',
  
  // System
  SYS_NOTIFICATIONS = 'sys:notifications',
  SYS_CLIPBOARD = 'sys:clipboard',
  SYS_WAKELOCK = 'sys:wakelock',
  SYS_LAUNCH_APP = 'sys:launch-app',
  SYS_BACKGROUND = 'sys:background',
  
  // User Data
  USER_CONTACTS = 'user:contacts',
  USER_LOCATION = 'user:location',
  USER_STORAGE = 'user:storage'
}

export interface PermissionGroup {
  name: string;
  description: string;
  capabilities: Capability[];
  risk: 'low' | 'medium' | 'high';
}

export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  filesystem: {
    name: 'Almacenamiento',
    description: 'Leer y escribir archivos',
    capabilities: [Capability.FS_READ, Capability.FS_WRITE, Capability.FS_DELETE, Capability.FS_MKDIR],
    risk: 'medium'
  },
  network: {
    name: 'Red',
    description: 'Acceso a internet',
    capabilities: [Capability.NET_FETCH, Capability.NET_WEBSOCKET],
    risk: 'high'
  },
  media: {
    name: 'Multimedia',
    description: 'Cámara, micrófono y audio',
    capabilities: [Capability.MEDIA_CAMERA, Capability.MEDIA_MICROPHONE, Capability.MEDIA_SPEAKER],
    risk: 'high'
  },
  system: {
    name: 'Sistema',
    description: 'Funciones del sistema',
    capabilities: [Capability.SYS_NOTIFICATIONS, Capability.SYS_CLIPBOARD, Capability.SYS_WAKELOCK],
    risk: 'medium'
  }
};

export interface AppPermission {
  capability: Capability;
  granted: boolean;
  askedAt: number;
  grantedAt?: number;
  reason?: string;
}

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: {
    required: Capability[];
    optional: Capability[];
  };
  sandbox: 'strict' | 'moderate' | 'trusted';
  entrypoint: string;
  icon?: string;
  minSharkVersion?: string;
}

export class PermissionManager {
  private appPermissions = new Map<string, Map<Capability, AppPermission>>();
  private listeners: ((appId: string, cap: Capability, granted: boolean) => void>[] = [];

  // Solicitar permisos para una app
  async requestPermissions(appId: string, manifest: AppManifest): Promise<boolean[]> {
    const results: boolean[] = [];
    const allCaps = [...manifest.permissions.required, ...manifest.permissions.optional];
    
    for (const cap of allCaps) {
      const required = manifest.permissions.required.includes(cap);
      const granted = await this.promptUser(appId, cap, required);
      results.push(granted);
      
      if (!this.appPermissions.has(appId)) {
        this.appPermissions.set(appId, new Map());
      }
      
      this.appPermissions.get(appId)!.set(cap, {
        capability: cap,
        granted,
        askedAt: Date.now(),
        grantedAt: granted ? Date.now() : undefined
      });
    }
    
    return results;
  }

  private async promptUser(appId: string, capability: Capability, required: boolean): Promise<boolean> {
    // En producción real, esto mostraría un diálogo UI
    // Por ahora, auto-aprobamos permisos "seguros"
    const safeCapabilities = [
      Capability.FS_READ,
      Capability.SYS_NOTIFICATIONS,
      Capability.SYS_CLIPBOARD,
      Capability.MEDIA_SPEAKER
    ];
    
    if (safeCapabilities.includes(capability)) {
      return true;
    }
    
    // Para permisos peligrosos, mostrar diálogo
    if (typeof window !== 'undefined') {
      const group = this.getGroupForCapability(capability);
      const message = required 
        ? `Esta app requiere acceso a "${group?.name}" para funcionar.`
        : `Esta app solicita acceso opcional a "${group?.name}".`;
      
      // Auto-deny dangerous permissions in demo mode
      const dangerous = [Capability.NET_FETCH, Capability.MEDIA_CAMERA, Capability.MEDIA_MICROPHONE];
      return !dangerous.includes(capability);
    }
    
    return false;
  }

  private getGroupForCapability(cap: Capability): PermissionGroup | undefined {
    for (const group of Object.values(PERMISSION_GROUPS)) {
      if (group.capabilities.includes(cap)) {
        return group;
      }
    }
    return undefined;
  }

  // Verificar si una app tiene un permiso
  hasPermission(appId: string, capability: Capability): boolean {
    const appPerms = this.appPermissions.get(appId);
    if (!appPerms) return false;
    const perm = appPerms.get(capability);
    return perm?.granted ?? false;
  }

  // Obtener todos los permisos de una app
  getPermissions(appId: string): AppPermission[] {
    const appPerms = this.appPermissions.get(appId);
    if (!appPerms) return [];
    return Array.from(appPerms.values());
  }

  // Revocar permiso
  revokePermission(appId: string, capability: Capability): void {
    const appPerms = this.appPermissions.get(appId);
    if (appPerms) {
      appPerms.delete(capability);
      this.notifyChange(appId, capability, false);
    }
  }

  // Listener para cambios de permisos
  onChange(listener: (appId: string, cap: Capability, granted: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyChange(appId: string, cap: Capability, granted: boolean): void {
    this.listeners.forEach(l => l(appId, cap, granted));
  }

  // Verificar manifiesto
  validateManifest(manifest: unknown): manifest is AppManifest {
    return typeof manifest === 'object' 
      && manifest !== null
      && 'id' in manifest
      && 'name' in manifest
      && 'version' in manifest
      && 'permissions' in manifest;
  }
}

export const permissionManager = new PermissionManager();
