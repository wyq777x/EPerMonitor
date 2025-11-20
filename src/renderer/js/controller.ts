/**
 * 主控制器 - Controller层
 * 负责协调View和Model之间的交互
 */

import type {MonitoringData, ProcessInfo} from '../../types/global';

export class AppController {
  private uiManager: any;
  private chartManager: any;
  private isMonitoring: boolean;
  private updateInterval: number;
  private mockInterval: number|null;
  private processInterval: number|null;
  private processUpdateInterval: number;

  constructor() {
    this.uiManager = new (window as any).UIManager();
    this.chartManager = new (window as any).ChartManager('monitorChart');
    this.isMonitoring = false;
    this.updateInterval = 1000;
    this.mockInterval = null;
    this.processInterval = null;
    this.processUpdateInterval = 5000;

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

    // 加载进程列表并开始轮询
    await this.loadProcessList();
    this.startProcessPolling();

    console.log('✅ 应用控制器初始化完成');
  }

  bindEvents(): void {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.startMonitoring());
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopMonitoring());
    }

    if (aiAnalyzeBtn) {
      aiAnalyzeBtn.addEventListener('click', () => this.performAIAnalysis());
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

    window.addEventListener('beforeunload', () => {
      this.cleanup();
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
        window.electronAPI.getCPUInfo(),
        window.electronAPI.getMemoryInfo(),
        window.electronAPI.getDiskInfo(),
        window.electronAPI.getNetworkInfo(),
      ]);

      this.uiManager.updateCPU(cpu);
      this.uiManager.updateMemory(memory);
      this.uiManager.updateDisk(disk);
      this.uiManager.updateNetwork(network);
      this.uiManager.updateProcessList(this.generateMockProcesses());

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
      const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'flex';
      if (aiAnalyzeBtn) aiAnalyzeBtn.style.display = 'flex';

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
      const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
      if (startBtn) startBtn.style.display = 'flex';
      if (stopBtn) stopBtn.style.display = 'none';
      if (aiAnalyzeBtn) aiAnalyzeBtn.style.display = 'none';

      console.log('✅ 监控已停止');
    } catch (error) {
      console.error('❌ 停止监控失败:', error);
      this.uiManager.showError('无法停止监控');
    }
  }

  handleMonitoringData(data: MonitoringData): void {
    try {
      // 保存最新的监控数据供 AI 分析使用
      this.latestMonitoringData = data;

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

  private async loadProcessList(): Promise<void> {
    try {
      if (!window.electronAPI || !window.electronAPI.getProcessList) {
        this.uiManager.updateProcessList(this.generateMockProcesses());
        return;
      }

      const processes = await window.electronAPI.getProcessList();
      this.uiManager.updateProcessList(processes);
    } catch (error) {
      console.error('❌ 加载进程列表失败:', error);
    }
  }

  private startProcessPolling(): void {
    if (this.processInterval) {
      return;
    }

    this.processInterval = window.setInterval(() => {
      void this.loadProcessList();
    }, this.processUpdateInterval);
  }

  private stopProcessPolling(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  private cleanup(): void {
    this.stopProcessPolling();

    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  private loadMockData(): void {
    const mockCPU = {
      usage: Math.random() * 100,
      cores: 8,
      model: 'Intel Core i7',
      speed: 3600,
      temperature: 45,
    };

    const mockMemory = {
      total: 16 * 1024 * 1024 * 1024,
      used: 8 * 1024 * 1024 * 1024,
      free: 8 * 1024 * 1024 * 1024,
      usagePercent: 50,
    };

    const mockDisk = {
      disks: [
        {
          name: '/dev/sda1',
          total: 500 * 1024 * 1024 * 1024,
          used: 250 * 1024 * 1024 * 1024,
          free: 250 * 1024 * 1024 * 1024,
          usagePercent: 50,
        },
      ],
    };

    const mockNetwork = {
      interfaces: [
        {
          name: 'eth0',
          ip: '192.168.1.100',
          mac: '00:11:22:33:44:55',
          rxBytes: 1024 * 1024,
          txBytes: 512 * 1024,
          rxSpeed: 1024,
          txSpeed: 512,
        },
      ],
    };

    this.uiManager.updateCPU(mockCPU);
    this.uiManager.updateMemory(mockMemory);
    this.uiManager.updateDisk(mockDisk);
    this.uiManager.updateNetwork(mockNetwork);
    this.uiManager.updateProcessList(this.generateMockProcesses());
  }

  private startMockMonitoring(): void {
    this.isMonitoring = true;
    this.uiManager.updateStatus('监控中... (模拟)', null);

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'flex';
    if (aiAnalyzeBtn) aiAnalyzeBtn.style.display = 'flex';

    this.mockInterval = window.setInterval(() => {
      const mockData: MonitoringData = {
        timestamp: Date.now(),
        cpu: {
          usage: 20 + Math.random() * 60,
          cores: 8,
          model: 'Intel Core i7',
          speed: 3600,
          temperature: 45 + Math.random() * 10,
        },
        memory: {
          total: 16 * 1024 * 1024 * 1024,
          used: 8 * 1024 * 1024 * 1024,
          free: 8 * 1024 * 1024 * 1024,
          usagePercent: 40 + Math.random() * 40,
        },
        disk: {
          disks: [
            {
              name: '/dev/sda1',
              total: 500 * 1024 * 1024 * 1024,
              used: 250 * 1024 * 1024 * 1024,
              free: 250 * 1024 * 1024 * 1024,
              usagePercent: 50,
            },
          ],
        },
        network: {
          interfaces: [
            {
              name: 'eth0',
              ip: '192.168.1.100',
              mac: '00:11:22:33:44:55',
              rxBytes: 1024 * 1024,
              txBytes: 512 * 1024,
              rxSpeed: Math.random() * 10240,
              txSpeed: Math.random() * 5120,
            },
          ],
        },
      };

      this.handleMonitoringData(mockData);
      this.uiManager.updateProcessList(this.generateMockProcesses());
    }, this.updateInterval);
  }

  private generateMockProcesses(): ProcessInfo[] {
    const processes: ProcessInfo[] = [];

    for (let i = 0; i < 12; i++) {
      processes.push({
        pid: 1000 + i,
        name: `mock-process-${i}`,
        cpu: Math.random() * 25,
        memory: (50 + Math.random() * 400) * 1024 * 1024,
      });
    }

    return processes;
  }

  private latestMonitoringData: MonitoringData|null = null;

  async performAIAnalysis(): Promise<void> {
    try {
      // 获取当前的监控数据
      let currentData: MonitoringData|null = this.latestMonitoringData;

      // 如果没有缓存的数据,尝试获取实时数据
      if (!currentData && window.electronAPI) {
        const [cpu, memory, disk, network] = await Promise.all([
          window.electronAPI.getCPUInfo(),
          window.electronAPI.getMemoryInfo(),
          window.electronAPI.getDiskInfo(),
          window.electronAPI.getNetworkInfo(),
        ]);
        currentData = {
          cpu,
          memory,
          disk,
          network,
          timestamp: Date.now(),
        };
      }

      if (!currentData) {
        this.showMessage('无法获取监控数据，请先开始监控', 'error');
        return;
      }

      // 显示自定义输入对话框获取 API Key
      const apiKey = await this.showApiKeyInput();
      if (!apiKey || apiKey.trim() === '') {
        return;
      }

      // 显示加载状态
      this.uiManager.updateStatus('AI分析中...', null);
      const aiAnalyzeBtn =
          document.getElementById('aiAnalyzeBtn') as HTMLButtonElement;
      if (aiAnalyzeBtn) {
        aiAnalyzeBtn.disabled = true;
        aiAnalyzeBtn.textContent = '分析中...';
      }

      // 调用 AI 分析
      const result = await window.electronAPI.analyzeSystemPerformance(
          apiKey.trim(), currentData);

      // 恢复按钮状态
      if (aiAnalyzeBtn) {
        aiAnalyzeBtn.disabled = false;
        aiAnalyzeBtn.innerHTML = '<span class="icon">🤖</span>AI分析';
      }
      this.uiManager.updateStatus(
          this.isMonitoring ? '监控中...' : '就绪', null);

      if (result.success && result.analysis) {
        // 显示分析结果
        this.showAnalysisResult(result.analysis);
      } else {
        this.showMessage(`AI分析失败: ${result.error || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('❌ AI分析失败:', error);
      this.showMessage(`AI分析失败: ${(error as Error).message}`, 'error');

      // 恢复按钮状态
      const aiAnalyzeBtn =
          document.getElementById('aiAnalyzeBtn') as HTMLButtonElement;
      if (aiAnalyzeBtn) {
        aiAnalyzeBtn.disabled = false;
        aiAnalyzeBtn.innerHTML = '<span class="icon">🤖</span>AI分析';
      }
      this.uiManager.updateStatus(
          this.isMonitoring ? '监控中...' : '就绪', null);
    }
  }

  private showApiKeyInput(): Promise<string|null> {
    return new Promise((resolve) => {
      // 创建模态框
      const modal = document.createElement('div');
      modal.className = 'ai-modal-overlay';

      const content = document.createElement('div');
      content.className = 'ai-modal-content';

      const title = document.createElement('h2');
      title.className = 'ai-modal-title';
      title.textContent = '🔑 输入 DeepSeek API Key';

      const description = document.createElement('p');
      description.className = 'ai-modal-description';
      description.textContent =
          '请输入您的 DeepSeek API Key 以进行 AI 性能分析';

      const input = document.createElement('input');
      input.className = 'ai-modal-input';
      input.type = 'password';
      input.placeholder = 'sk-...';

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'ai-modal-button-container';

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'ai-modal-button confirm';
      confirmBtn.textContent = '确认';
      confirmBtn.onclick = () => {
        modal.remove();
        resolve(input.value);
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'ai-modal-button cancel';
      cancelBtn.textContent = '取消';
      cancelBtn.onclick = () => {
        modal.remove();
        resolve(null);
      };

      // 按 Enter 键确认
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          confirmBtn.click();
        } else if (e.key === 'Escape') {
          cancelBtn.click();
        }
      };

      buttonContainer.appendChild(confirmBtn);
      buttonContainer.appendChild(cancelBtn);

      content.appendChild(title);
      content.appendChild(description);
      content.appendChild(input);
      content.appendChild(buttonContainer);
      modal.appendChild(content);
      document.body.appendChild(modal);

      // 自动聚焦输入框
      setTimeout(() => input.focus(), 100);

      // 点击背景关闭
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(null);
        }
      };
    });
  }

  private showMessage(message: string, type: 'success'|'error'|'info'): void {
    const modal = document.createElement('div');
    modal.className = 'ai-modal-overlay';

    const content = document.createElement('div');
    content.className = `ai-modal-content medium ${type}`;

    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';

    const messageText = document.createElement('p');
    messageText.className = 'ai-modal-message';
    messageText.textContent = `${icon} ${message}`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ai-modal-button close full-width';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => modal.remove();

    content.appendChild(messageText);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };
  }

  private showAnalysisResult(analysis: string): void {
    // 创建一个模态框显示分析结果
    const modal = document.createElement('div');
    modal.className = 'ai-modal-overlay';

    const content = document.createElement('div');
    content.className = 'ai-modal-content large';

    const title = document.createElement('h2');
    title.className = 'ai-modal-title';
    title.textContent = '🤖 AI 性能分析报告';

    const analysisText = document.createElement('pre');
    analysisText.className = 'ai-modal-analysis';
    analysisText.textContent = analysis;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ai-modal-button close full-width';
    closeBtn.textContent = '关闭';
    closeBtn.onclick = () => modal.remove();

    content.appendChild(title);
    content.appendChild(analysisText);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };
  }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
