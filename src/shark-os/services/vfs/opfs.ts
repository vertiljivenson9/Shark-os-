import { FileSystemBackend, FileType } from '../../types';

// Worker script: Receives PATH (string) instead of Handle (object) to avoid Cloning Errors in WebKit
const WORKER_SCRIPT = `
self.onmessage = async (e) => {
  const { id, path, data } = e.data;
  try {
    if (!navigator.storage || !navigator.storage.getDirectory) {
        throw new Error("Storage API not available in worker");
    }
    const root = await navigator.storage.getDirectory();
    
    // Traverse path to get handle inside worker context
    // This avoids passing a non-cloneable handle from main thread
    const parts = path.split('/').filter(p => p.length > 0);
    const fileName = parts.pop();
    
    let current = root;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
    
    const fileHandle = await current.getFileHandle(fileName, { create: true });
    
    // Attempt to use SyncAccessHandle (Worker Only feature)
    const accessHandle = await fileHandle.createSyncAccessHandle();
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    
    accessHandle.truncate(0);
    accessHandle.write(buffer, { at: 0 });
    accessHandle.flush();
    accessHandle.close();
    
    self.postMessage({ id, success: true });
  } catch (err) {
    self.postMessage({ id, success: false, error: err.toString() });
  }
};
`;

export class OPFSBackend implements FileSystemBackend {
  private root: FileSystemDirectoryHandle | null = null;
  private vaultName = 'SECURE_VAULT.sys';
  private lockFileName = '.vault_lock';
  
  // Worker Fallback for Safari/WebKit
  private worker: Worker | null = null;
  private workerRequests = new Map<number, (res: any) => void>();
  private reqId = 0;

  async mount(): Promise<void> {
    if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
      throw new Error('OPFS not supported in this browser');
    }
    this.root = await navigator.storage.getDirectory();
  }

  async requestPersistence(): Promise<boolean> {
    try {
      if (navigator.storage && navigator.storage.persist) {
        return await navigator.storage.persist();
      }
    } catch (e) {
      console.warn('Persistence request failed:', e);
    }
    return false;
  }

  // --- Crypto ---

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Worker Fallback Logic ---

  private getWorker(): Worker {
    if (!this.worker) {
      const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = (e) => {
        const { id, success, error } = e.data;
        const resolver = this.workerRequests.get(id);
        if (resolver) {
          resolver(success ? { success: true } : { success: false, error });
          this.workerRequests.delete(id);
        }
      };
    }
    return this.worker;
  }

  // FIXED: Takes path (string) instead of handle
  private async writeWithWorker(path: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.reqId++;
      this.workerRequests.set(id, (res) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Worker write failed'));
      });
      // Pass the full path relative to OPFS root
      this.getWorker().postMessage({ id, path, data });
    });
  }

  // --- Operations ---

  async isLocked(): Promise<boolean> {
    if (!this.root) await this.mount();
    try {
        await this.root!.getDirectoryHandle(this.vaultName);
        const vault = await this.root!.getDirectoryHandle(this.vaultName);
        await vault.getFileHandle(this.lockFileName);
        return true;
    } catch {
        return false;
    }
  }

  async createLock(password: string): Promise<boolean> {
    if (!this.root) await this.mount();
    try {
        const hash = await this.hashPassword(password);
        const vault = await this.root!.getDirectoryHandle(this.vaultName, { create: true });
        const fileHandle = await vault.getFileHandle(this.lockFileName, { create: true });
        
        const data = JSON.stringify({ 
            hash, 
            created: Date.now(), 
            algo: 'SHA-256' 
        });

        // Try native write first, fallback to worker
        let written = false;
        if ((fileHandle as any).createWritable) {
            try {
                const writable = await (fileHandle as any).createWritable();
                await writable.write(data);
                await writable.close();
                written = true;
            } catch (e) {
                console.warn('[OPFS] createLock: Native write failed, falling back', e);
            }
        } 
        
        if (!written) {
            const fullPath = `${this.vaultName}/${this.lockFileName}`;
            await this.writeWithWorker(fullPath, data);
        }
        return true;
    } catch (e) {
        console.error('Lock creation failed', e);
        return false;
    }
  }

  async unlock(password: string): Promise<boolean> {
    if (!this.root) await this.mount();
    try {
        const vault = await this.root!.getDirectoryHandle(this.vaultName);
        const fileHandle = await vault.getFileHandle(this.lockFileName);
        const file = await fileHandle.getFile();
        const text = await file.text();
        const config = JSON.parse(text);
        
        const inputHash = await this.hashPassword(password);
        return inputHash === config.hash;
    } catch (e) {
        return false;
    }
  }

  async initVault(): Promise<boolean> {
    if (!this.root) await this.mount();
    try {
      await this.root!.getDirectoryHandle(this.vaultName, { create: true });
      return true;
    } catch (e) {
      console.error('[OPFS] Vault Init Failed', e);
      return false;
    }
  }

  private async getHandle(path: string, create = false, type: 'file' | 'dir' = 'file'): Promise<FileSystemHandle | null> {
    if (!this.root) await this.mount();
    const parts = path.split('/').filter(p => p.length > 0);
    let currentDir = await this.root!.getDirectoryHandle(this.vaultName, { create: false }); 

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      try {
        if (isLast) {
          if (type === 'file') return await currentDir.getFileHandle(part, { create });
          else return await currentDir.getDirectoryHandle(part, { create });
        } else {
          currentDir = await currentDir.getDirectoryHandle(part, { create });
        }
      } catch (e) { return null; }
    }
    return currentDir;
  }

  async exists(path: string): Promise<boolean> {
    if (path === '' || path === '/') return true;
    try {
      const f = await this.getHandle(path, false, 'file');
      if (f) return true;
      const d = await this.getHandle(path, false, 'dir');
      return !!d;
    } catch { return false; }
  }

  async ls(path: string): Promise<string[]> {
    if (!this.root) await this.mount();
    
    let handle;
    try {
        if (path === '' || path === '/') {
            handle = await this.root!.getDirectoryHandle(this.vaultName);
        } else {
            handle = await this.getHandle(path, false, 'dir') as FileSystemDirectoryHandle;
        }
    } catch(e) {
        throw new Error(`Path not found: ${path}`);
    }

    if (!handle) throw new Error(`Path not found: ${path}`);

    const results: string[] = [];
    // @ts-ignore
    for await (const [name, entry] of handle.entries()) {
      if (name === this.lockFileName) continue;
      results.push(name + (entry.kind === 'directory' ? '/' : ''));
    }
    return results;
  }

  async cat(path: string): Promise<string> {
    const handle = await this.getHandle(path, false, 'file') as FileSystemFileHandle;
    if (!handle) throw new Error(`File not found: ${path}`);
    const file = await handle.getFile();
    return await file.text();
  }

  async write(path: string, data: string): Promise<void> {
    const handle = await this.getHandle(path, true, 'file') as FileSystemFileHandle;
    if (!handle) throw new Error(`Could not write: ${path}`);
    
    let written = false;
    if ((handle as any).createWritable) {
       try {
           const writable = await (handle as any).createWritable();
           await writable.write(data);
           await writable.close();
           written = true;
       } catch (e) {
           console.warn('[OPFS] Native write failed, falling back to worker', e);
       }
    } 
    
    if (!written) {
       // Clean leading slash from input path to avoid double slashes
       const cleanPath = path.startsWith('/') ? path.slice(1) : path;
       const fullPath = `${this.vaultName}/${cleanPath}`;
       await this.writeWithWorker(fullPath, data);
    }
  }

  async mkdir(path: string): Promise<void> {
    await this.getHandle(path, true, 'dir');
  }

  async rm(path: string): Promise<void> {
    const parts = path.split('/').filter(p => p.length > 0);
    const name = parts.pop();
    if (!name) return;
    
    let currentDir = await this.root!.getDirectoryHandle(this.vaultName);
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part);
    }
    await currentDir.removeEntry(name, { recursive: true });
  }
}