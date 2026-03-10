export class MachineIdentity {
  static getMachineId(): string {
    const STORAGE_KEY = 'system.machine.id';
    
    // Check storage first
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    // Generate new ID
    // Algo: UUID + screen info + navigator info + random salt
    const raw = [
      crypto.randomUUID(),
      window.screen.width,
      window.screen.height,
      navigator.userAgent,
      Date.now()
    ].join('|');

    // Create a deterministic-looking hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Combine with a fresh UUID for uniqueness
    const id = `mach-${Math.abs(hash).toString(16)}-${crypto.randomUUID().split('-')[0]}`;
    
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  }
}