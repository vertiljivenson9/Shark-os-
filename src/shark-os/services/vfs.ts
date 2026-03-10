
import { IVFS, FileSystemBackend, FileType } from '../types';

export class VFS implements IVFS {
  private mounts: { path: string; backend: FileSystemBackend }[] = [];

  mount(path: string, backend: FileSystemBackend): void {
    this.mounts = this.mounts.filter(m => m.path !== path);
    this.mounts.push({ path, backend });
    this.mounts.sort((a, b) => b.path.length - a.path.length);
  }

  private resolve(path: string) {
    const cleanPath = path === '/' ? '/' : path.replace(/\/$/, '');
    for (const m of this.mounts) {
      const matchPrefix = m.path === '/' ? '/' : `${m.path}/`;
      if (cleanPath === m.path || cleanPath.startsWith(matchPrefix)) {
        return { backend: m.backend, relativePath: cleanPath };
      }
    }
    return null;
  }

  async ls(path: string): Promise<string[]> {
    const r = this.resolve(path);
    if (!r) throw new Error(`VFS: No mount at ${path}`);
    const res = await r.backend.ls(r.relativePath);
    return res;
  }

  async cat(path: string): Promise<string> {
    const r = this.resolve(path);
    return r ? r.backend.cat(r.relativePath) : '';
  }

  async write(path: string, data: string): Promise<void> {
    const r = this.resolve(path);
    if (!r) throw new Error("VFS: Unmounted path");
    
    // Auto-reparación de directorios faltantes
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
        current += '/' + parts[i];
        if (!(await this.exists(current))) {
            await this.mkdir(current);
        }
    }
    await r.backend.write(r.relativePath, data);
  }

  async mkdir(path: string): Promise<void> {
    const r = this.resolve(path);
    if (r) await r.backend.mkdir(r.relativePath);
  }

  async rm(path: string): Promise<void> {
    const r = this.resolve(path);
    if (r) await r.backend.rm(r.relativePath);
  }

  async exists(path: string): Promise<boolean> {
    const r = this.resolve(path);
    return r ? r.backend.exists(r.relativePath) : false;
  }
}
