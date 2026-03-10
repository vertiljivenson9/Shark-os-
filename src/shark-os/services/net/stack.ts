
import { kernel } from '../kernel';

export class NetworkStack {
  private cacheDir = '/tmp/net/cache';
  private initialized = false;

  async init() {
    if (this.initialized) return;
    // Forzamos la creación de la ruta de caché
    try {
        await kernel.fs.mkdir('/tmp');
        await kernel.fs.mkdir('/tmp/net');
        await kernel.fs.mkdir(this.cacheDir);
    } catch (e) {}
    this.initialized = true;
    console.log("[NetStack] Canal de datos sincronizado.");
  }

  async request(url: string, options: any = {}) {
    if (!this.initialized) await this.init();
    try {
      const resp = await fetch(url, options);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch (e: any) {
      throw new Error(`Network Error: ${e.message}`);
    }
  }
}
