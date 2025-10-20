/**
 * 全局类型定义
 */

export interface SystemInfo {
  platform: string;
  hostname: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;
  uptime: number;
}

export interface CPUInfo {
  usage: number;
  cores: number;
  model: string;
  speed: number;
  temperature: number;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  usagePercent: number;
}

export interface DiskInfo {
  name: string;
  total: number;
  used: number;
  free: number;
  usagePercent: number;
}

export interface DiskData {
  disks: DiskInfo[];
}

export interface NetworkInterface {
  name: string;
  ip: string;
  mac: string;
  rxBytes: number;
  txBytes: number;
  rxSpeed: number;
  txSpeed: number;
}

export interface NetworkData {
  interfaces: NetworkInterface[];
}

export interface MonitoringData {
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskData;
  network: NetworkData;
  timestamp: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

export interface ElectronAPI {
  getSystemInfo: () => Promise<SystemInfo>;
  getCPUInfo: () => Promise<CPUInfo>;
  getMemoryInfo: () => Promise<MemoryInfo>;
  getDiskInfo: () => Promise<DiskData>;
  getNetworkInfo: () => Promise<NetworkData>;
  getProcessList: () => Promise<ProcessInfo[]>;
  startMonitoring: (interval?: number) => Promise<{success: boolean}>;
  stopMonitoring: () => Promise<{success: boolean}>;
  onMonitoringData: (callback: (data: MonitoringData) => void) => void;
  removeMonitoringListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    UIManager: typeof import('../renderer/js/app').UIManager;
    ChartManager: typeof import('../renderer/js/chart').ChartManager;
  }
}
