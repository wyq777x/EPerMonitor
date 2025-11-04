import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

import type {
  CPUInfo,
  DiskData,
  MemoryInfo,
  MonitoringData,
  NetworkData,
  ProcessInfo,
  SystemInfo,
} from "./types/global";

// 安全地暴露API到渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 获取系统信息
  getSystemInfo: (): Promise<SystemInfo> =>
    ipcRenderer.invoke("get-system-info"),

  // 获取CPU信息
  getCPUInfo: (): Promise<CPUInfo> => ipcRenderer.invoke("get-cpu-info"),

  // 获取内存信息
  getMemoryInfo: (): Promise<MemoryInfo> =>
    ipcRenderer.invoke("get-memory-info"),

  // 获取磁盘信息
  getDiskInfo: (): Promise<DiskData> => ipcRenderer.invoke("get-disk-info"),

  // 获取网络信息
  getNetworkInfo: (): Promise<NetworkData> =>
    ipcRenderer.invoke("get-network-info"),

  // 获取进程列表
  getProcessList: (): Promise<ProcessInfo[]> =>
    ipcRenderer.invoke("get-process-list"),

  // 开始监控
  startMonitoring: (interval?: number): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("start-monitoring", interval),

  // 停止监控
  stopMonitoring: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("stop-monitoring"),

  // 监听监控数据
  onMonitoringData: (callback: (data: MonitoringData) => void): void => {
    ipcRenderer.on(
      "monitoring-data",
      (_event: IpcRendererEvent, data: MonitoringData) => callback(data),
    );
  },

  // 移除监听器
  removeMonitoringListener: (): void => {
    ipcRenderer.removeAllListeners("monitoring-data");
  },
});
