import { kernel } from '../kernel';

export class AudioMixer {
  private ctx: AudioContext;
  private appGains: Map<string, GainNode> = new Map();
  private masterGain: GainNode;
  private isMuted: boolean = false;
  private previousVolume: number = 1.0;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  async init() {
    await this.restoreState();
  }

  private async restoreState() {
    try {
      if (await kernel.fs.exists('/system/media/volume.json')) {
        const data = JSON.parse(await kernel.fs.cat('/system/media/volume.json'));
        this.masterGain.gain.value = data.master !== undefined ? data.master : 1.0;
        this.isMuted = !!data.muted;
        if (this.isMuted) {
           this.previousVolume = this.masterGain.gain.value;
           this.masterGain.gain.value = 0;
        }
      }
    } catch(e) {}
  }

  async saveState() {
    // If muted, save the "previousVolume" as master so we restore to that level when unmuted
    // If not muted, save current gain
    const volToSave = this.isMuted ? this.previousVolume : this.masterGain.gain.value;
    const data = { master: volToSave, muted: this.isMuted };
    await kernel.fs.write('/system/media/volume.json', JSON.stringify(data));
  }

  createSource(appId: string): AudioNode {
    let gain = this.appGains.get(appId);
    if (!gain) {
      gain = this.ctx.createGain();
      gain.connect(this.masterGain);
      this.appGains.set(appId, gain);
    }
    return gain;
  }

  setVolume(appId: string, val: number) {
    const gain = this.appGains.get(appId);
    if (gain) gain.gain.value = Math.max(0, Math.min(1, val));
  }

  setMasterVolume(val: number) {
    if (this.isMuted) {
      this.previousVolume = Math.max(0, Math.min(1, val));
    } else {
      this.masterGain.gain.value = Math.max(0, Math.min(1, val));
    }
    this.saveState();
  }

  setMute(mute: boolean) {
    if (mute === this.isMuted) return;
    this.isMuted = mute;
    
    if (mute) {
      this.previousVolume = this.masterGain.gain.value;
      this.masterGain.gain.value = 0;
    } else {
      this.masterGain.gain.value = this.previousVolume;
    }
    this.saveState();
  }

  getMute(): boolean {
    return this.isMuted;
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}