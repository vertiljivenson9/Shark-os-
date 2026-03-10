import { IRegistry } from '../types';

const DB_NAME = 'WebOS_Registry';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

export class Registry implements IRegistry {
  private db: IDBDatabase | null = null;

  constructor() {}

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = (e) => reject((e.target as any).error);
      request.onsuccess = (e) => {
        this.db = (e.target as any).result;
        resolve(this.db!);
      };
      request.onupgradeneeded = (e) => {
        const db = (e.target as any).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
      req.onerror = () => resolve(undefined);
    });
  }

  async set(key: string, value: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async list(prefix: string): Promise<string[]> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () => {
        const keys = req.result as string[];
        resolve(keys.filter(k => k.startsWith(prefix)));
      };
    });
  }
}