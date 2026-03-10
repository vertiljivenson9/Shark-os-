import { kernel } from '../kernel';
import { BatteryManager } from '../../types';

export class PowerManager {
  private battery: BatteryManager | null = null;

  async init() {
    if ('getBattery' in navigator) {
      try {
        this.battery = await (navigator as any).getBattery();
        if (this.battery) {
          this.battery.addEventListener('levelchange', this.onLevelChange);
          this.onLevelChange(); // Initial check
        }
      } catch (e) {
        console.warn('Battery API failed', e);
      }
    }
  }

  private onLevelChange = () => {
    if (!this.battery) return;
    const level = this.battery.level * 100;
    console.log(`[Power] Battery Level: ${level}%`);
    if (level < 20 && !this.battery.charging) {
      this.triggerLowBattery();
    }
  };

  private triggerLowBattery() {
    console.warn('[Power] Low Battery Warning');
    // In a real implementation, dispatch event to UI
    kernel.registry.set('system.power.state', 'low');
  }

  async powerOff() {
    console.log('[Power] Shutting down...');
    // 1. Stop scheduler
    kernel.scheduler.stop();
    
    // 2. Kill all processes
    const procs = kernel.getProcesses();
    procs.forEach(p => kernel.killProcess(p.pid));

    // 3. Flush Registry & VFS (if needed)
    if (kernel.registry.flush) {
      await kernel.registry.flush();
    }

    // 4. "Turn off" screen by navigating away
    document.body.innerHTML = '<div style="background:black;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;color:#333;">System Halted</div>';
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 1000);
  }
}