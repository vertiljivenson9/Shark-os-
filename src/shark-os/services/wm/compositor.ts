import { WindowState } from '../../types';

export class Compositor {
  private windows: Map<string, WindowState> = new Map();
  private zIndexCounter = 100;

  registerWindow(win: WindowState) {
    this.windows.set(win.id, win);
    this.bringToFront(win.id);
  }

  unregisterWindow(id: string) {
    this.windows.delete(id);
  }

  bringToFront(id: string) {
    const win = this.windows.get(id);
    if (win) {
      this.zIndexCounter++;
      win.zIndex = this.zIndexCounter;
      this.windows.set(id, { ...win });
    }
  }

  updateWindow(id: string, updates: Partial<WindowState>) {
    const win = this.windows.get(id);
    if (win) {
      this.windows.set(id, { ...win, ...updates });
    }
  }

  getWindow(id: string): WindowState | undefined {
    return this.windows.get(id);
  }

  getAllWindows(): WindowState[] {
    // Return sorted by Z-Index
    return Array.from(this.windows.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  // Compositor optimization hints (simulated)
  getRenderHints(id: string) {
    return {
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden'
    };
  }
}