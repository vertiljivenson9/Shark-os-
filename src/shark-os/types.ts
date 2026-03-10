

export enum FileType {
  FILE = 'FILE',
  DIR = 'DIR'
}

export interface FileNode {
  path: string;
  name: string;
  type: FileType;
  content: string | null;
  parentId: string | null; 
  metadata: {
    created: number;
    modified: number;
    size: number;
  };
}

export interface Process {
  pid: number;
  name: string;
  status: 'running' | 'ready' | 'blocked' | 'suspended' | 'killed';
  startTime: number;
  priority: number;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  // Fix: Layout properties must support both numbers (px) and strings (e.g., 'vw', 'vh') for responsive geometry
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  processId: number;
  args?: any; // Added to support file associations
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string; 
  component: string;
  version: string;
  wasmUrl?: string; // For pkg manager
  defaultWidth?: number;
  defaultHeight?: number;
  // Monetization Fields
  price?: number;
  paymentUrl?: string;
  author?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: string;
  timestamp: number;
  urgent?: boolean;
}

export interface KernelContextType {
  boot: () => Promise<void>;
  shutdown: () => Promise<void>;
  launchApp: (appId: string, args?: string[]) => void;
  killProcess: (pid: number) => void;
  getProcesses: () => Process[];
  fs: IVFS;
  registry: IRegistry;
}

export interface FileSystemBackend {
  mount(): Promise<void>;
  ls(path: string): Promise<string[]>;
  cat(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  rm(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

export interface IVFS {
  mount(path: string, backend: FileSystemBackend): void;
  ls(path: string): Promise<string[]>;
  cat(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  rm(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

export interface IRegistry {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  flush?: () => Promise<void>;
}

export interface ShellCommand {
  argv: string[];
  redirect: string | null;
  env: Record<string, string>;
}

export interface NetworkRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}
