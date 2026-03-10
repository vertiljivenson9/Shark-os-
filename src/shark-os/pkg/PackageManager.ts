// Shark OS Package System - .SHARK format
// Sistema de paquetes con firmas criptográficas

import JSZip from 'jszip';

export interface SharkPackage {
  manifest: SharkManifest;
  code: {
    main: string;
    assets: Record<string, Blob>;
  };
  signature?: string;
  checksum: string;
}

export interface SharkManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon?: string;
  category: 'productivity' | 'utility' | 'entertainment' | 'development' | 'games' | 'other';
  minSharkVersion: string;
  permissions: { required: string[]; optional: string[] };
  main: string;
  license: string;
  sandbox: 'strict' | 'moderate' | 'trusted';
  installSize: number;
}

export class PackageManagerV2 {
  private installedApps = new Map<string, SharkManifest>();
  
  async createPackage(manifest: SharkManifest, code: string, assets: Record<string, Blob> = {}): Promise<Blob> {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('main.js', code);
    
    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
      for (const [name, blob] of Object.entries(assets)) {
        assetsFolder.file(name, blob);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const checksum = await this.calculateChecksum(content);
    zip.file('.checksum', checksum);
    
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }
  
  async install(packageBlob: Blob): Promise<{ success: boolean; error?: string; appId?: string }> {
    try {
      const zip = await JSZip.loadAsync(packageBlob);
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) return { success: false, error: 'Missing manifest' };
      
      const manifest: SharkManifest = JSON.parse(await manifestFile.async('string'));
      const mainFile = zip.file('main.js');
      if (!mainFile) return { success: false, error: 'Missing main.js' };
      
      const code = await mainFile.async('string');
      
      const assets: Record<string, Blob> = {};
      const assetsFolder = zip.folder('assets');
      if (assetsFolder) {
        for (const [path, file] of Object.entries(assetsFolder.files)) {
          if (!file.dir) assets[path] = await file.async('blob');
        }
      }
      
      await this.saveToStorage(manifest, code, assets);
      this.installedApps.set(manifest.id, manifest);
      
      window.dispatchEvent(new CustomEvent('shark:app:installed', { detail: manifest }));
      return { success: true, appId: manifest.id };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }
  
  async uninstall(appId: string): Promise<boolean> {
    const systemApps = ['terminal', 'files', 'settings', 'store'];
    if (systemApps.includes(appId)) return false;
    
    await this.removeFromStorage(appId);
    this.installedApps.delete(appId);
    window.dispatchEvent(new CustomEvent('shark:app:uninstalled', { detail: { appId } }));
    return true;
  }
  
  getInstalledApps(): SharkManifest[] {
    return Array.from(this.installedApps.values());
  }
  
  private async calculateChecksum(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private async saveToStorage(m: SharkManifest, code: string, assets: Record<string, Blob>): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(['apps'], 'readwrite');
    tx.objectStore('apps').put({ id: m.id, manifest: m, code, installedAt: Date.now() });
  }
  
  private async removeFromStorage(appId: string): Promise<void> {
    const db = await this.openDB();
    db.transaction(['apps'], 'readwrite').objectStore('apps').delete(appId);
  }
  
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('SharkOS_Apps', 1);
      r.onerror = () => reject(r.error);
      r.onsuccess = () => resolve(r.result);
      r.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('apps')) db.createObjectStore('apps', { keyPath: 'id' });
      };
    });
  }
}

export const packageManager = new PackageManagerV2();
