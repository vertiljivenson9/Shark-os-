import { kernel } from '../kernel';

export class ClipboardManager {
  private historyPath = '/user/home/.clipboard_history';

  constructor() {}

  async copy(text: string): Promise<void> {
    let success = false;
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (e) {
      console.warn('Clipboard API failed, using fallback');
      localStorage.setItem('webos_clipboard_fallback', text);
      success = true;
    }

    if (success) {
      await this.addToHistory(text);
    }
  }

  async paste(): Promise<string> {
    try {
      return await navigator.clipboard.readText();
    } catch (e) {
      return localStorage.getItem('webos_clipboard_fallback') || '';
    }
  }

  private async addToHistory(text: string) {
    let history: string[] = [];
    if (await kernel.fs.exists(this.historyPath)) {
      try {
        history = JSON.parse(await kernel.fs.cat(this.historyPath));
      } catch (e) {}
    }
    // Keep last 20
    history.unshift(text);
    if (history.length > 20) history = history.slice(0, 20);
    
    await kernel.fs.write(this.historyPath, JSON.stringify(history));
  }
}