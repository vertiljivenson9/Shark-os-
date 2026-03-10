import { kernel } from '../kernel';

export class VoiceControl {
  private recognition: any = null;
  private isListening: boolean = false;
  private listeners: ((listening: boolean) => void)[] = [];

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.trim().toLowerCase();
        console.log('[Voice] Heard:', command);
        this.processCommand(command);
      };

      this.recognition.onend = () => {
        if (this.isListening) this.recognition.start();
      };
    }
  }

  public subscribe(cb: (listening: boolean) => void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  public toggle() {
    if (!this.recognition) return;
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      kernel.notifications.push('Voice Control', 'Cortex deactivated.', false);
    } else {
      this.isListening = true;
      try {
          this.recognition.start();
          kernel.notifications.push('Voice Control', 'Cortex listening...', false);
      } catch (e) {
          console.error(e);
      }
    }
    this.listeners.forEach(cb => cb(this.isListening));
  }

  public getStatus() { return this.isListening; }

  private processCommand(cmd: string) {
    // 1. App Launching
    if (cmd.startsWith('open ') || cmd.startsWith('launch ')) {
        const appName = cmd.replace('open ', '').replace('launch ', '');
        // We broadcast asking the system to find the app by approximate name
        window.dispatchEvent(new CustomEvent('sys-voice-cmd', { detail: { type: 'launch', payload: appName } }));
        return;
    }

    // 2. Window Management
    if (cmd.includes('close window') || cmd.includes('close app')) {
        window.dispatchEvent(new CustomEvent('sys-voice-cmd', { detail: { type: 'close-active' } }));
        return;
    }

    if (cmd.includes('minimize') || cmd.includes('hide')) {
        window.dispatchEvent(new CustomEvent('sys-voice-cmd', { detail: { type: 'minimize-active' } }));
        return;
    }

    // 3. System Utilities
    if (cmd.includes('scroll down')) {
        // Broadcast scroll event to active window context
        // Implementation simplified for simulation
    }
    
    if (cmd.includes('go home') || cmd.includes('minimize all')) {
        window.dispatchEvent(new CustomEvent('sys-voice-cmd', { detail: { type: 'show-desktop' } }));
    }
  }
}