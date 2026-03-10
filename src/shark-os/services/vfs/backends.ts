import { FileSystemBackend, FileNode, FileType } from '../../types';

// --- IndexedDB Backend ---
export class IDBBackend implements FileSystemBackend {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;

  constructor(dbName: string = 'WebOS_VFS', storeName: string = 'files') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = (e) => reject('IDB Error: ' + (e.target as any).error);
      request.onsuccess = (e) => {
        this.db = (e.target as any).result;
        resolve(this.db!);
      };
      request.onupgradeneeded = (e) => {
        const db = (e.target as any).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'path' });
        }
      };
    });
  }

  async mount(): Promise<void> {
    await this.openDB();
  }

  // Helper to remove mount prefix from path before storing in IDB
  // In a real multi-root system, backends might be oblivious to their mount point,
  // treating their root as '/'. Here we assume paths passed to backend are relative to backend root 
  // OR we store full paths. For simplicity in this IDB implementation, we expect the VFS to pass 
  // paths that this backend manages.
  
  async exists(path: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise(resolve => {
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).get(path);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  }

  async ls(path: string): Promise<string[]> {
    const db = await this.openDB();
    // Normalize path: ensure no trailing slash unless root
    const searchPath = path === '/' ? '' : path.replace(/\/$/, '');
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).getAll();
      req.onsuccess = () => {
        const all: FileNode[] = req.result;
        const children = all
          .filter(f => {
            const parent = f.path.substring(0, f.path.lastIndexOf('/'));
            if (path === '/' || path === '') return parent === '';
            return parent === searchPath;
          })
          .map(f => f.name + (f.type === FileType.DIR ? '/' : ''));
        resolve(children);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async cat(path: string): Promise<string> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).get(path);
      req.onsuccess = () => {
        const file: FileNode = req.result;
        if (!file) reject(`File not found: ${path}`);
        else if (file.type === FileType.DIR) reject(`${path} is a directory`);
        else resolve(file.content || '');
      };
      req.onerror = () => reject(req.error);
    });
  }

  async write(path: string, data: string): Promise<void> {
    // Parent check skipped for brevity in backend, VFS should handle generic checks if possible,
    // but strict FS requires check.
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const node: FileNode = {
        path,
        name: path.split('/').pop() || '',
        type: FileType.FILE,
        content: data,
        parentId: path.substring(0, path.lastIndexOf('/')) || null,
        metadata: { created: Date.now(), modified: Date.now(), size: data.length }
      };
      const req = store.put(node);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async mkdir(path: string): Promise<void> {
    if (await this.exists(path)) throw new Error(`Exists: ${path}`);
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const node: FileNode = {
        path,
        name: path.split('/').pop() || '',
        type: FileType.DIR,
        content: null,
        parentId: path.substring(0, path.lastIndexOf('/')) || null,
        metadata: { created: Date.now(), modified: Date.now(), size: 0 }
      };
      const req = store.put(node);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async rm(path: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const req = tx.objectStore(this.storeName).delete(path);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

// --- Memory Backend ---
export class MemoryBackend implements FileSystemBackend {
  private files: Map<string, FileNode> = new Map();

  async mount(): Promise<void> {
    this.files.clear();
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async ls(path: string): Promise<string[]> {
    const searchPath = path === '/' ? '' : path.replace(/\/$/, '');
    const res: string[] = [];
    for (const [p, node] of this.files.entries()) {
      const parent = p.substring(0, p.lastIndexOf('/'));
      if ((path === '/' && parent === '') || parent === searchPath) {
        res.push(node.name + (node.type === FileType.DIR ? '/' : ''));
      }
    }
    return res;
  }

  async cat(path: string): Promise<string> {
    const node = this.files.get(path);
    if (!node) throw new Error(`Not found: ${path}`);
    if (node.type === FileType.DIR) throw new Error(`Is dir: ${path}`);
    return node.content || '';
  }

  async write(path: string, data: string): Promise<void> {
    this.files.set(path, {
      path,
      name: path.split('/').pop() || '',
      type: FileType.FILE,
      content: data,
      parentId: path.substring(0, path.lastIndexOf('/')) || null,
      metadata: { created: Date.now(), modified: Date.now(), size: data.length }
    });
  }

  async mkdir(path: string): Promise<void> {
    this.files.set(path, {
      path,
      name: path.split('/').pop() || '',
      type: FileType.DIR,
      content: null,
      parentId: path.substring(0, path.lastIndexOf('/')) || null,
      metadata: { created: Date.now(), modified: Date.now(), size: 0 }
    });
  }

  async rm(path: string): Promise<void> {
    this.files.delete(path);
  }
}