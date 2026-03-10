import { kernel } from '../kernel';

type GestureType = 'swipe-up' | 'pinch' | 'long-press' | 'three-tap';

interface Point { x: number; y: number; id: number; }

export class GestureRecognizer {
  private activePoints: Map<number, Point> = new Map();
  private startPoints: Map<number, Point> = new Map();
  private startTime: number = 0;
  private longPressTimer: number | null = null;
  private listeners: ((type: GestureType, data?: any) => void)[] = [];

  constructor() {}

  attach(element: HTMLElement) {
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerUp);
    element.style.touchAction = 'none'; // Prevent browser defaults
  }

  addListener(cb: (type: GestureType, data?: any) => void) {
    this.listeners.push(cb);
  }

  private emit(type: GestureType, data?: any) {
    this.listeners.forEach(cb => cb(type, data));
  }

  private onPointerDown = (e: PointerEvent) => {
    const p = { x: e.clientX, y: e.clientY, id: e.pointerId };
    this.activePoints.set(e.pointerId, p);
    this.startPoints.set(e.pointerId, p);

    if (this.activePoints.size === 1) {
      this.startTime = Date.now();
      this.longPressTimer = window.setTimeout(() => {
        if (this.activePoints.size === 1) {
          const curr = this.activePoints.get(e.pointerId);
          const start = this.startPoints.get(e.pointerId);
          if (curr && start && Math.abs(curr.x - start.x) < 10 && Math.abs(curr.y - start.y) < 10) {
            this.emit('long-press', { x: curr.x, y: curr.y });
          }
        }
      }, 600);
    }

    if (this.activePoints.size === 3) {
      if (Date.now() - this.startTime < 300) {
        this.emit('three-tap');
      }
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = { x: e.clientX, y: e.clientY, id: e.pointerId };
    this.activePoints.set(e.pointerId, p);

    // Pinch Detection
    if (this.activePoints.size === 2) {
      // Logic for pinch would calculate distance delta vs start distance
      // Omitted for brevity, but this is where it lives
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
    
    const start = this.startPoints.get(e.pointerId);
    const end = { x: e.clientX, y: e.clientY };

    if (start) {
      const dy = end.y - start.y;
      const dt = Date.now() - this.startTime;

      // Swipe Up (Bottom of screen trigger typically, but here generalized)
      if (dy < -100 && dt < 300 && this.activePoints.size === 1) {
        this.emit('swipe-up');
      }
    }

    this.activePoints.delete(e.pointerId);
    this.startPoints.delete(e.pointerId);
  };
}