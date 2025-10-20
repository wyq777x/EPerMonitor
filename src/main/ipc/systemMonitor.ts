import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type {CPUInfo, DiskData, MemoryInfo, MonitoringData, NetworkData, ProcessInfo, SystemInfo} from '../../types/global';

interface NativeMonitor {
  getSystemInfo: () => SystemInfo;
  getCPUInfo: () => CPUInfo;
  getMemoryInfo: () => MemoryInfo;
  getDiskInfo: () => DiskData;
  getNetworkInfo: () => NetworkData;
  getProcessList: () => {
    processes: ProcessInfo[]
  };
  cleanup?: () => void;
}

/**
 * 系统监控器类 - MVC中的Controller层
 * 负责协调C++后端和Electron前端之间的通信
 */
export class SystemMonitor {
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout|null = null;
  private nativeMonitor: NativeMonitor|null = null;

  constructor() {
    // 尝试加载C++原生模块
    try {
      const addonPath = path.join(
          __dirname, '../../../backend/build/Release/system_monitor.node');
      if (fs.existsSync(addonPath)) {
        this.nativeMonitor = require(addonPath) as NativeMonitor;
        console.log('✅ C++ 原生监控模块加载成功');
      } else {
        console.warn('⚠️ C++ 模块未找到，使用 Node.js 后备实现');
      }
    } catch (error) {
      console.error('❌ C++ 模块加载失败:', (error as Error).message);
      console.log('使用 Node.js 后备实现');
    }
  }

  /**
   * 获取系统基本信息
   */
  getSystemInfo(): SystemInfo {
    if (this.nativeMonitor) {
      return this.nativeMonitor.getSystemInfo();
    }

    // Node.js 后备实现
    const cpus = os.cpus();
    return {
      platform: os.platform(),
      hostname: os.hostname(),
      arch: os.arch(),
      cpuModel: cpus[0]?.model || 'Unknown',
      cpuCores: cpus.length,
      totalMemory: os.totalmem(),
      uptime: os.uptime()
    };
  }

  /**
   * 获取CPU信息
   */
  getCPUInfo(): CPUInfo {
    if (this.nativeMonitor) {
      return this.nativeMonitor.getCPUInfo();
    }

    // Node.js 后备实现
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const usage = 100 - Math.floor((100 * totalIdle) / totalTick);

    return {
      usage,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      temperature: 0  // Node.js 无法获取温度
    };
  }

  /**
   * 获取内存信息
   */
  getMemoryInfo(): MemoryInfo {
    if (this.nativeMonitor) {
      return this.nativeMonitor.getMemoryInfo();
    }

    // Node.js 后备实现
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      total,
      used,
      free,
      usagePercent: parseFloat(((used / total) * 100).toFixed(2))
    };
  }

  /**
   * 获取磁盘信息
   */
  getDiskInfo(): DiskData {
    if (this.nativeMonitor) {
      return this.nativeMonitor.getDiskInfo();
    }

    // Node.js 后备实现（简化版）
    return {disks: [{name: '/', total: 0, used: 0, free: 0, usagePercent: 0}]};
  }

  /**
   * 获取网络信息
   */
  getNetworkInfo(): NetworkData {
    if (this.nativeMonitor) {
      return this.nativeMonitor.getNetworkInfo();
    }

    // Node.js 后备实现
    const interfaces = os.networkInterfaces();
    const networks = [];

    for (const name in interfaces) {
      const iface = interfaces[name];
      if (!iface) continue;

      const ipv4 = iface.find((i) => i.family === 'IPv4');
      if (ipv4 && !ipv4.internal) {
        networks.push({
          name,
          ip: ipv4.address,
          mac: ipv4.mac,
          rxBytes: 0,
          txBytes: 0,
          rxSpeed: 0,
          txSpeed: 0
        });
      }
    }

    return {interfaces: networks};
  }

  /**
   * 获取进程列表
   */
  getProcessList(): {processes: ProcessInfo[]} {
    if (this.nativeMonitor) {
      return this.nativeMonitor.getProcessList();
    }

    // Node.js 后备实现
    return {
      processes: [{
        pid: process.pid,
        name: 'electron',
        cpu: 0,
        memory: process.memoryUsage().heapUsed
      }]
    };
  }

  /**
   * 开始监控
   */
  startMonitoring(interval: number, callback: (data: MonitoringData) => void):
      void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      const data: MonitoringData = {
        timestamp: Date.now(),
        cpu: this.getCPUInfo(),
        memory: this.getMemoryInfo(),
        disk: this.getDiskInfo(),
        network: this.getNetworkInfo()
      };

      callback(data);
    }, interval);

    console.log(`✅ 开始监控，间隔: ${interval}ms`);
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('⏹️ 停止监控');
    }
  }

  /**
   * 清理资源
   */
  stop(): void {
    this.stopMonitoring();
    if (this.nativeMonitor && this.nativeMonitor.cleanup) {
      this.nativeMonitor.cleanup();
    }
  }
}
