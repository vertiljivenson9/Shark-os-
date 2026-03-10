
import { kernel } from '../kernel';

export class PackageManager {
  async init() { if (!(await kernel.fs.exists('/system/apps'))) await kernel.fs.mkdir('/system/apps'); }

  async installVPX(path: string) {
    const raw = await kernel.fs.cat(path);
    const pkg = JSON.parse(raw);
    await kernel.fs.write(`/system/apps/${pkg.manifest.id}.json`, JSON.stringify(pkg.manifest));
    const installed = await kernel.registry.get('apps.installed') || [];
    if (!installed.includes(pkg.manifest.id)) {
      await kernel.registry.set('apps.installed', [...installed, pkg.manifest.id]);
    }
    window.dispatchEvent(new CustomEvent('sys-app-install', { detail: pkg.manifest.id }));
  }

  async uninstall(appId: string) {
    const installed = await kernel.registry.get('apps.installed') || [];
    await kernel.registry.set('apps.installed', installed.filter((id: string) => id !== appId));
    window.dispatchEvent(new CustomEvent('sys-app-uninstall', { detail: appId }));
  }

  isSystemApp(id: string) { return ['terminal', 'files', 'settings', 'store', 'zip_export'].includes(id); }
}
