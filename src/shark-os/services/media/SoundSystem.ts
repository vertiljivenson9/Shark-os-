// Shark OS Sound System - Sonidos del sistema realistas
// Generados proceduralmente con Web Audio API

export type SoundType = 
  | 'boot' | 'shutdown' | 'login' | 'logout' | 'lock' | 'unlock'
  | 'notification' | 'warning' | 'error' | 'success' | 'question'
  | 'click' | 'open' | 'close' | 'minimize' | 'maximize' | 'restore'
  | 'trash' | 'download' | 'upload' | 'copy' | 'paste' | 'delete'
  | 'message' | 'mail' | 'reminder' | 'alarm'
  | 'volume_change' | 'brightness_change' | 'screenshot'
  | 'keypress' | 'backspace' | 'enter' | 'tab';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;
  
  async init() {
    if (typeof window === 'undefined') return;
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
    
    // Cargar preferencias
    try {
      const saved = localStorage.getItem('shark-sound-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.enabled = settings.enabled ?? true;
        this.volume = settings.volume ?? 0.5;
        this.masterGain.gain.value = this.volume;
      }
    } catch {}
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.saveSettings();
  }
  
  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    this.saveSettings();
  }
  
  private saveSettings() {
    localStorage.setItem('shark-sound-settings', JSON.stringify({
      enabled: this.enabled,
      volume: this.volume
    }));
  }
  
  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }
  
  // Reproducir sonido
  play(type: SoundType) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    this.resume();
    
    switch(type) {
      case 'boot': this.playBoot(); break;
      case 'shutdown': this.playShutdown(); break;
      case 'login': this.playLogin(); break;
      case 'logout': this.playLogout(); break;
      case 'lock': this.playLock(); break;
      case 'unlock': this.playUnlock(); break;
      case 'notification': this.playNotification(); break;
      case 'warning': this.playWarning(); break;
      case 'error': this.playError(); break;
      case 'success': this.playSuccess(); break;
      case 'question': this.playQuestion(); break;
      case 'click': this.playClick(); break;
      case 'open': this.playOpen(); break;
      case 'close': this.playClose(); break;
      case 'minimize': this.playMinimize(); break;
      case 'maximize': this.playMaximize(); break;
      case 'restore': this.playRestore(); break;
      case 'trash': this.playTrash(); break;
      case 'download': this.playDownload(); break;
      case 'upload': this.playUpload(); break;
      case 'copy': this.playCopy(); break;
      case 'paste': this.playPaste(); break;
      case 'delete': this.playDelete(); break;
      case 'message': this.playMessage(); break;
      case 'mail': this.playMail(); break;
      case 'reminder': this.playReminder(); break;
      case 'alarm': this.playAlarm(); break;
      case 'volume_change': this.playVolumeChange(); break;
      case 'brightness_change': this.playBrightnessChange(); break;
      case 'screenshot': this.playScreenshot(); break;
      case 'keypress': this.playKeypress(); break;
      case 'backspace': this.playBackspace(); break;
      case 'enter': this.playEnter(); break;
      case 'tab': this.playTab(); break;
    }
  }
  
  // ===== SONIDOS DE SISTEMA =====
  
  private playBoot() {
    // Sonido de arranque épico - acordes ascendentes
    const now = this.ctx!.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
    
    // Añadir brillo
    const shimmer = this.ctx!.createOscillator();
    const shimmerGain = this.ctx!.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.value = 1046.50; // C6
    shimmerGain.gain.setValueAtTime(0, now + 0.6);
    shimmerGain.gain.linearRampToValueAtTime(0.05, now + 0.7);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.masterGain!);
    shimmer.start(now + 0.6);
    shimmer.stop(now + 1.3);
  }
  
  private playShutdown() {
    const now = this.ctx!.currentTime;
    const notes = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4 descendente
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.2);
      osc.frequency.linearRampToValueAtTime(freq * 0.5, now + i * 0.2 + 0.3);
      
      gain.gain.setValueAtTime(0.12, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.5);
    });
  }
  
  private playLogin() {
    const now = this.ctx!.currentTime;
    const melody = [392.00, 493.88, 587.33]; // G4, B4, D5
    
    melody.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  }
  
  private playLogout() {
    this.playTone(440, 0.15, 'triangle', 0.1);
    setTimeout(() => this.playTone(330, 0.2, 'triangle', 0.08), 150);
  }
  
  private playLock() {
    this.playTone(880, 0.08, 'sine', 0.08);
    setTimeout(() => this.playTone(660, 0.12, 'sine', 0.06), 80);
  }
  
  private playUnlock() {
    this.playTone(660, 0.08, 'sine', 0.06);
    setTimeout(() => this.playTone(880, 0.12, 'sine', 0.08), 80);
  }
  
  // ===== NOTIFICACIONES =====
  
  private playNotification() {
    const now = this.ctx!.currentTime;
    
    // Ding elegante
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 880;
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.5);
    
    // Armónico
    const osc2 = this.ctx!.createOscillator();
    const gain2 = this.ctx!.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1320;
    gain2.gain.setValueAtTime(0.08, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.4);
  }
  
  private playWarning() {
    const now = this.ctx!.currentTime;
    
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = 440;
      
      gain.gain.setValueAtTime(0.1, now + i * 0.2);
      gain.gain.setValueAtTime(0.1, now + i * 0.2 + 0.08);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.2);
    }
  }
  
  private playError() {
    const now = this.ctx!.currentTime;
    
    // Sonido de error distintivo
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.3);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
  
  private playSuccess() {
    const now = this.ctx!.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  }
  
  private playQuestion() {
    this.playTone(440, 0.1, 'sine', 0.08);
    setTimeout(() => this.playTone(550, 0.15, 'sine', 0.06), 100);
  }
  
  // ===== UI SOUNDS =====
  
  private playClick() {
    this.playTone(1200, 0.03, 'sine', 0.05);
  }
  
  private playOpen() {
    const now = this.ctx!.currentTime;
    
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }
  
  private playClose() {
    const now = this.ctx!.currentTime;
    
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }
  
  private playMinimize() {
    this.playTone(600, 0.05, 'triangle', 0.06);
  }
  
  private playMaximize() {
    this.playTone(800, 0.05, 'triangle', 0.06);
  }
  
  private playRestore() {
    this.playTone(700, 0.05, 'triangle', 0.05);
  }
  
  // ===== ACCIONES =====
  
  private playTrash() {
    const now = this.ctx!.currentTime;
    
    // Sonido de "papel arrugándose"
    const noise = this.createNoise();
    const filter = this.ctx!.createBiquadFilter();
    const gain = this.ctx!.createGain();
    
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    noise.start(now);
    noise.stop(now + 0.25);
  }
  
  private playDownload() {
    const now = this.ctx!.currentTime;
    
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.2);
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }
  
  private playUpload() {
    const now = this.ctx!.currentTime;
    
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.2);
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }
  
  private playCopy() {
    this.playTone(1000, 0.04, 'sine', 0.05);
    setTimeout(() => this.playTone(1200, 0.04, 'sine', 0.04), 50);
  }
  
  private playPaste() {
    this.playTone(800, 0.04, 'sine', 0.05);
    setTimeout(() => this.playTone(1000, 0.06, 'sine', 0.04), 50);
  }
  
  private playDelete() {
    const now = this.ctx!.currentTime;
    
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }
  
  // ===== COMUNICACIÓN =====
  
  private playMessage() {
    const now = this.ctx!.currentTime;
    
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.5, now); // E6
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(now);
    osc.stop(now + 0.2);
    
    // Segundo tono
    const osc2 = this.ctx!.createOscillator();
    const gain2 = this.ctx!.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1568; // G6
    gain2.gain.setValueAtTime(0.1, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  }
  
  private playMail() {
    // Sonido de "tienes correo"
    const notes = [659.25, 783.99, 987.77]; // E5, G5, B5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 'sine', 0.08), i * 100);
    });
  }
  
  private playReminder() {
    this.playTone(880, 0.1, 'triangle', 0.08);
    setTimeout(() => this.playTone(1100, 0.1, 'triangle', 0.06), 150);
  }
  
  private playAlarm() {
    const now = this.ctx!.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = 880;
      
      gain.gain.setValueAtTime(0.12, now + i * 0.3);
      gain.gain.setValueAtTime(0.12, now + i * 0.3 + 0.1);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.3 + 0.25);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now + i * 0.3);
      osc.stop(now + i * 0.3 + 0.3);
    }
  }
  
  // ===== SISTEMA =====
  
  private playVolumeChange() {
    this.playTone(500, 0.03, 'sine', 0.04);
  }
  
  private playBrightnessChange() {
    this.playTone(700, 0.03, 'sine', 0.03);
  }
  
  private playScreenshot() {
    // Sonido de "cámara"
    const now = this.ctx!.currentTime;
    
    const noise = this.createNoise();
    const gain = this.ctx!.createGain();
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noise.connect(gain);
    gain.connect(this.masterGain!);
    
    noise.start(now);
    noise.stop(now + 0.1);
    
    // Click mecánico
    const osc = this.ctx!.createOscillator();
    const gain2 = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.value = 150;
    gain2.gain.setValueAtTime(0.1, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain2);
    gain2.connect(this.masterGain!);
    osc.start(now + 0.05);
    osc.stop(now + 0.15);
  }
  
  // ===== TECLADO =====
  
  private playKeypress() {
    this.playTone(800 + Math.random() * 200, 0.015, 'sine', 0.02);
  }
  
  private playBackspace() {
    this.playTone(300, 0.025, 'triangle', 0.03);
  }
  
  private playEnter() {
    this.playTone(500, 0.03, 'triangle', 0.04);
  }
  
  private playTab() {
    this.playTone(600, 0.02, 'sine', 0.025);
  }
  
  // ===== UTILIDADES =====
  
  private playTone(freq: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
  
  private createNoise(): AudioBufferSourceNode {
    const bufferSize = this.ctx!.sampleRate * 0.5;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}

export const soundSystem = new SoundSystem();
