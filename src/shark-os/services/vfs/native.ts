import { FileSystemBackend, FileType } from '../../types';

export class NativeFSBackend implements FileSystemBackend {
  private rootHandle: FileSystemDirectoryHandle;

  constructor(handle: FileSystemDirectoryHandle) {
    this.rootHandle = handle;
  }

  async mount(): Promise<void> {
    // Already mounted via constructor injection
  }

  // Traverse the native handle based on the relative path
  private async getHandle(path: string, create = false, type: 'file' | 'dir' = 'file'): Promise<FileSystemHandle | null> {
    const parts = path.split('/').filter(p => p.length > 0);
    let current = this.rootHandle;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      try {
        if (isLast) {
          if (type === 'file') return await current.getFileHandle(part, { create });
          else return await current.getDirectoryHandle(part, { create });
        } else {
          current = await current.getDirectoryHandle(part, { create });
        }
      } catch (e) {
        return null;
      }
    }
    return current;
  }

  async exists(path: string): Promise<boolean> {
    if (path === '' || path === '/') return true;
    try {
      // Try directory first
      const d = await this.getHandle(path, false, 'dir');
      if (d) return true;
      const f = await this.getHandle(path, false, 'file');
      return !!f;
    } catch {
      return false;
    }
  }

  async ls(path: string): Promise<string[]> {
    let handle: FileSystemDirectoryHandle;
    
    if (path === '' || path === '/') {
        handle = this.rootHandle;
    } else {
        const h = await this.getHandle(path, false, 'dir');
        if (!h || h.kind !== 'directory') throw new Error(`Path not found or not a directory: ${path}`);
        handle = h as FileSystemDirectoryHandle;
    }

    const results: string[] = [];
    // @ts-ignore - TS definition for async iterator on handles varies by environment
    for await (const [name, entry] of handle.entries()) {
      results.push(name + (entry.kind === 'directory' ? '/' : ''));
    }
    return results;
  }

  async cat(path: string): Promise<string> {
    const handle = await this.getHandle(path, false, 'file');
    if (!handle || handle.kind !== 'file') throw new Error(`File not found: ${path}`);
    const fileHandle = handle as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    
    // Heuristic: If it's media, return object URL (blob), else text
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        return URL.createObjectURL(file);
    }
    
    return await file.text();
  }

  async write(path: string, data: string): Promise<void> {
    const handle = await this.getHandle(path, true, 'file');
    if (!handle || handle.kind !== 'file') throw new Error(`Could not create file: ${path}`);
    const fileHandle = handle as FileSystemFileHandle;
    
    // @ts-ignore - createWritable exists in Chromium browsers
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  async mkdir(path: string): Promise<void> {
    await this.getHandle(path, true, 'dir');
  }

  async rm(path: string): Promise<void> {
    const parts = path.split('/').filter(p => p.length > 0);
    const name = parts.pop();
    if (!name) return; // Can't delete root

    // Get parent handle
    let parent = this.rootHandle;
    for (const part of parts) {
        parent = await parent.getDirectoryHandle(part);
    }
    
    await parent.removeEntry(name, { recursive: true });
  }
}