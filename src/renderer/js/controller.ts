/**
 * 主控制器 - Controller层
 * 负责协调View和Model之间的交互
 */

import type {MonitoringData} from '../../types/global';

export class AppController {
  private uiManager: any;
  private chartManager: any;
  private isMonitoring: boolean;
  private updateInterval: number;
  private mockInterval: number|null;

  constructor() {
    this.uiManager = new (window as any).UIManager();
    this.chartManager = new (window as any).ChartManager('monitorChart');
    this.isMonitoring = false;
    this.updateInterval = 1000;
    this.mockInterval = null;

    this.init();
  }

  async init(): Promise<void> {
    console.log('🚀 初始化应用控制器...');

    // 绑定按钮事件
    this.bindEvents();

    // 加载系统信息
    await this.loadSystemInfo();

    // 初始数据加载
    await this.loadInitialData();

    console.log('✅ 应用控制器初始化完成');
  }

  bindEvents(): void {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.startMonitoring());
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopMonitoring());
    }

    // 监听来自主进程的数据
    if (window.electronAPI && window.electronAPI.onMonitoringData) {
      window.electronAPI.onMonitoringData((data) => {
        this.handleMonitoringData(data);
      });
    }

    // 窗口大小改变时重新设置canvas
    window.addEventListener('resize', () => {
      if (this.chartManager) {
        this.chartManager.setupCanvas();
      }
    });
  }

  async loadSystemInfo(): Promise<void> {
    try {
      if (!window.electronAPI) {
        console.warn('⚠️ Electron API 不可用');
        return;
      }

      const info = await window.electronAPI.getSystemInfo();
      console.log('📊 系统信息:', info);
      this.uiManager.updateSystemInfo(info);
      this.uiManager.updateStatus('就绪', info.uptime);
    } catch (error) {
      console.error('❌ 加载系统信息失败:', error);
      this.uiManager.showError('无法加载系统信息');
    }
  }

  async loadInitialData(): Promise<void> {
    try {
      if (!window.electronAPI) {
        console.warn('⚠️ Electron API 不可用，使用模拟数据');
        this.loadMockData();
        return;
      }

      // 并行加载所有数据
      const [cpu, memory, disk, network] = await Promise.all([
        window.electronAPI.getCPUInfo(), window.electronAPI.getMemoryInfo(),
        window.electronAPI.getDiskInfo(), window.electronAPI.getNetworkInfo()
      ]);

      this.uiManager.updateCPU(cpu);
      this.uiManager.updateMemory(memory);
      this.uiManager.updateDisk(disk);
      this.uiManager.updateNetwork(network);

      console.log('✅ 初始数据加载完成');
    } catch (error) {
      console.error('❌ 加载初始数据失败:', error);
      this.uiManager.showError('无法加载监控数据');
    }
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ 监控已在运行');
      return;
    }

    try {
      console.log('▶️ 开始监控...');

      if (!window.electronAPI) {
        console.warn('⚠️ Electron API 不可用，使用模拟监控');
        this.startMockMonitoring();
        return;
      }

      await window.electronAPI.startMonitoring(this.updateInterval);

      this.isMonitoring = true;
      this.uiManager.updateStatus('监控中...', null);

      // 切换按钮
      const startBtn = document.getElementById('startBtn');
      const stopBtn = document.getElementById('stopBtn');
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'flex';

      console.log('✅ 监控已启动');
    } catch (error) {
      console.error('❌ 启动监控失败:', error);
      this.uiManager.showError('无法启动监控');
    }
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('⚠️ 监控未运行');
      return;
    }

    try {
      console.log('⏸️ 停止监控...');

      if (this.mockInterval) {
        clearInterval(this.mockInterval);
        this.mockInterval = null;
      }

      if (window.electronAPI) {
        await window.electronAPI.stopMonitoring();
      }

      this.isMonitoring = false;
      this.uiManager.updateStatus('已停止', null);

      // 切换按钮
      const startBtn = document.getElementById('startBtn');
      const stopBtn = document.getElementById('stopBtn');
      if (startBtn) startBtn.style.display = 'flex';
      if (stopBtn) stopBtn.style.display = 'none';

      console.log('✅ 监控已停止');
    } catch (error) {
      console.error('❌ 停止监控失败:', error);
      this.uiManager.showError('无法停止监控');
    }
  }

  handleMonitoringData(data: MonitoringData): void {
    try {
      // 更新UI
      this.uiManager.updateCPU(data.cpu);
      this.uiManager.updateMemory(data.memory);
      this.uiManager.updateDisk(data.disk);
      this.uiManager.updateNetwork(data.network);

      // 更新图表
      this.chartManager.addData(data.cpu.usage, data.memory.usagePercent);
    } catch (error) {
      console.error('❌ 处理监控数据失败:', error);
    }
  }

  private loadMockData(): void {
    const mockCPU = {
      usage: Math.random() * 100,
      cores: 8,
      model: 'Intel Core i7',
      speed: 3600,
      temperature: 45
    };

    const mockMemory = {
      total: 16 * 1024 * 1024 * 1024,
      used: 8 * 1024 * 1024 * 1024,
      free: 8 * 1024 * 1024 * 1024,
      usagePercent: 50
    };

    const mockDisk = {
      disks: [{
        name: '/dev/sda1',
        total: 500 * 1024 * 1024 * 1024,
        used: 250 * 1024 * 1024 * 1024,
        free: 250 * 1024 * 1024 * 1024,
        usagePercent: 50
      }]
    };

    const mockNetwork = {
      interfaces: [{
        name: 'eth0',
        ip: '192.168.1.100',
        mac: '00:11:22:33:44:55',
        rxBytes: 1024 * 1024,
        txBytes: 512 * 1024,
        rxSpeed: 1024,
        txSpeed: 512
      }]
    };

    this.uiManager.updateCPU(mockCPU);
    this.uiManager.updateMemory(mockMemory);
    this.uiManager.updateDisk(mockDisk);
    this.uiManager.updateNetwork(mockNetwork);
  }

  private startMockMonitoring(): void {
    this.isMonitoring = true;
    this.uiManager.updateStatus('监控中... (模拟)', null);

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'flex';

    this.mockInterval = window.setInterval(() => {
      const mockData: MonitoringData = {
        timestamp: Date.now(),
        cpu: {
          usage: 20 + Math.random() * 60,
          cores: 8,
          model: 'Intel Core i7',
          speed: 3600,
          temperature: 45 + Math.random() * 10
        },
        memory: {
          total: 16 * 1024 * 1024 * 1024,
          used: 8 * 1024 * 1024 * 1024,
          free: 8 * 1024 * 1024 * 1024,
          usagePercent: 40 + Math.random() * 40
        },
        disk: {
          disks: [{
            name: '/dev/sda1',
            total: 500 * 1024 * 1024 * 1024,
            used: 250 * 1024 * 1024 * 1024,
            free: 250 * 1024 * 1024 * 1024,
            usagePercent: 50
          }]
        },
        network: {
          interfaces: [{
            name: 'eth0',
            ip: '192.168.1.100',
            mac: '00:11:22:33:44:55',
            rxBytes: 1024 * 1024,
            txBytes: 512 * 1024,
            rxSpeed: Math.random() * 10240,
            txSpeed: Math.random() * 5120
          }]
        }
      };

      this.handleMonitoringData(mockData);
    }, this.updateInterval);
  }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
