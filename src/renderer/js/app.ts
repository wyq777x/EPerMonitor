/**
 * 主应用逻辑 - View层
 */

import type {CPUInfo, DiskData, MemoryInfo, NetworkData, SystemInfo,} from '../../types/global';

// 工具函数：格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 工具函数：格式化时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

// 工具函数：更新进度环
function updateProgressRing(
    circleId: string,
    textId: string,
    percent: number,
    ): void {
  const circle = document.getElementById(circleId) as SVGCircleElement | null;
  const text = document.getElementById(textId);

  if (!circle || !text) return;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDashoffset = offset.toString();
  text.textContent = `${percent}%`;

  // 动态改变颜色
  if (percent < 50) {
    circle.style.stroke = '#43e97b';
  } else if (percent < 80) {
    circle.style.stroke = '#fee140';
  } else {
    circle.style.stroke = '#f5576c';
  }
}

// UI更新类
export class UIManager {
  constructor() {}

  // 更新系统信息
  updateSystemInfo(info: SystemInfo): void {
    const hostnameEl = document.getElementById('hostname');
    if (hostnameEl) {
      hostnameEl.textContent =
          `${info.hostname} | ${info.platform} ${info.arch}`;
    }
  }

  // 更新CPU信息
  updateCPU(data: CPUInfo): void {
    const usage = Math.round(data.usage ?? 0);

    // 更新进度环
    updateProgressRing('cpuCircle', 'cpuText', usage);

    // 更新徽章
    const badge = document.getElementById('cpuBadge');
    if (badge) {
      badge.textContent = `${usage}%`;
      badge.style.background =
          usage > 80 ? 'var(--gradient-2)' : 'var(--gradient-3)';
    }

    // 更新详细信息
    this.updateElement('cpuCores', (data.cores || '-').toString());
    this.updateElement('cpuSpeed', data.speed ? `${data.speed} MHz` : '-');
    const modelEl = document.getElementById('cpuModel');
    const rawModel = data.model ?? '';
    const trimmedModel = rawModel.trim();
    const hasModel = trimmedModel.length > 0;

    if (modelEl) {
      modelEl.textContent = hasModel ? trimmedModel : '-';

      if (hasModel) {
        modelEl.setAttribute('title', rawModel);
        modelEl.classList.add('wrap-text');
      } else {
        modelEl.removeAttribute('title');
        modelEl.classList.remove('wrap-text');
      }
    }
    this.updateElement(
        'cpuTemp',
        data.temperature ? `${data.temperature}°C` : '-',
    );
  }

  // 更新内存信息
  updateMemory(data: MemoryInfo): void {
    const usage = parseFloat((data.usagePercent ?? 0).toString());
    const usageRounded = Math.round(usage);

    // 更新进度环
    updateProgressRing('memCircle', 'memText', usageRounded);

    // 更新徽章
    const badge = document.getElementById('memBadge');
    if (badge) {
      badge.textContent = `${usageRounded}%`;
      badge.style.background =
          usage > 80 ? 'var(--gradient-2)' : 'var(--gradient-3)';
    }

    // 更新详细信息
    this.updateElement('memTotal', formatBytes(data.total ?? 0));
    this.updateElement('memUsed', formatBytes(data.used ?? 0));
    this.updateElement('memFree', formatBytes(data.free ?? 0));
    this.updateElement('memPercent', `${usage.toFixed(1)}%`);
  }

  // 更新磁盘信息
  updateDisk(data: DiskData): void {
    const container = document.getElementById('diskList');
    if (!container || !data.disks) return;

    if (data.disks.length === 0) {
      container.innerHTML = '<div class="loading">暂无磁盘数据</div>';
      return;
    }

    const existingItems = container.querySelectorAll('.disk-item');

    if (existingItems.length !== data.disks.length) {
      this.rebuildDiskList(container, data.disks);
    }

    // Update each disk item incrementally
    data.disks.forEach((disk, index) => {
      const diskItem = existingItems[index] as HTMLElement | null;
      if (!diskItem) return;

      // update disk-name
      const nameElement = diskItem.querySelector('.disk-name');
      if (nameElement) {
        nameElement.textContent = disk.name ?? 'Unknown';
      }

      // update disk-usage percentage
      const usageElement = diskItem.querySelector('.disk-usage');
      const usagePercent = Math.round(disk.usagePercent ?? 0);
      if (usageElement) {
        usageElement.textContent = `${usagePercent}%`;
      }

      const progressBar = diskItem.querySelector(
                              '.disk-progress-bar',
                              ) as HTMLElement |
          null;
      if (progressBar) {
        progressBar.style.width = `${usagePercent}%`;
      }
    });
  }

  private rebuildDiskList(container: HTMLElement, disks: any[]): void {
    container.innerHTML = disks
                              .map(
                                  (disk) => ` <div class="disk-item">
        <div class="disk-header">
          <span class="disk-name">${disk.name ?? '未知'}</span>
          <span class="disk-usage">${Math.round(disk.usagePercent ?? 0)}%</span>
        </div>
        <div class="disk-progress">
          <div class="disk-progress-bar" style="width: ${
                                      Math.round(
                                          disk.usagePercent ?? 0,
                                          )}%"></div>
        </div>
        <div class="disk-info">
          <span>已用: ${formatBytes(disk.used ?? 0)}</span>
          <span>可用: ${formatBytes(disk.free ?? 0)}</span>
          <span>总计: ${formatBytes(disk.total ?? 0)}</span>
        </div>
      </div>`,
                                  )
                              .join('');

    const items = container.querySelectorAll('.disk-item');
    items.forEach((item, index) => {
      item.classList.add('fade-in');
      setTimeout(
          () => {
            item.classList.remove('fade-in');
          },
          300 + index * 50,
      );
    });
  }

  // 更新网络信息
  updateNetwork(data: NetworkData): void {
    const container = document.getElementById('networkList');
    if (!container || !data.interfaces) return;

    if (data.interfaces.length === 0) {
      container.innerHTML = '<div class="loading">暂无网络数据</div>';
      return;
    }

    const existingItems = container.querySelectorAll('.network-item');

    if (existingItems.length !== data.interfaces.length) {
      this.rebuildNetworkList(container, data.interfaces);
      return;
    }

    // Update each network item incrementally
    data.interfaces.forEach((iface, index) => {
      const networkItem = existingItems[index] as HTMLElement | null;
      if (!networkItem) return;

      // update network-name
      const nameElement = networkItem.querySelector('.network-name');
      if (nameElement) {
        nameElement.textContent = iface.name ?? '未知';
      }

      // update network-ip
      const ipElement = networkItem.querySelector('.network-ip');
      if (ipElement) {
        ipElement.textContent = iface.ip ?? '-';
      }

      // update download speed
      const downloadValue =
          networkItem.querySelectorAll('.network-stat')[0]?.querySelector(
              '.value');
      if (downloadValue) {
        downloadValue.textContent = this.formatSpeed(iface.rxSpeed ?? 0);
      }

      // update upload speed
      const uploadValue =
          networkItem.querySelectorAll('.network-stat')[1]?.querySelector(
              '.value');
      if (uploadValue) {
        uploadValue.textContent = this.formatSpeed(iface.txSpeed ?? 0);
      }

      // update MAC address
      const macValue =
          networkItem.querySelectorAll('.network-stat')[2]?.querySelector(
              '.value');
      if (macValue) {
        macValue.textContent = iface.mac ?? '-';
      }
    });
  }

  private rebuildNetworkList(container: HTMLElement, interfaces: any[]): void {
    container.innerHTML = interfaces
                              .map(
                                  (iface) => `
      <div class="network-item">
        <div class="network-header">
          <span class="network-name">${iface.name ?? '未知'}</span>
          <span class="network-ip">${iface.ip ?? '-'}</span>
        </div>
        <div class="network-info">
          <div class="network-stat">
            <span class="label">↓ 下载:</span>
            <span class="value">${this.formatSpeed(iface.rxSpeed ?? 0)}</span>
          </div>
          <div class="network-stat">
            <span class="label">↑ 上传:</span>
            <span class="value">${this.formatSpeed(iface.txSpeed ?? 0)}</span>
          </div>
          <div class="network-stat">
            <span class="label">MAC:</span>
            <span class="value">${iface.mac ?? '-'}</span>
          </div>
        </div>
      </div>
    `,
                                  )
                              .join('');

    const items = container.querySelectorAll('.network-item');
    items.forEach((item, index) => {
      item.classList.add('fade-in');
      setTimeout(
          () => {
            item.classList.remove('fade-in');
          },
          300 + index * 50,
      );
    });
  }

  // 更新状态
  updateStatus(status: string, uptime: number|null): void {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = status;
    }

    if (uptime !== null) {
      const uptimeEl = document.getElementById('uptime');
      if (uptimeEl) {
        uptimeEl.textContent = formatUptime(uptime);
      }
    }
  }

  // 显示错误
  showError(message: string): void {
    console.error('❌', message);
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = `错误: ${message}`;
      statusEl.style.color = 'var(--danger)';
    }
  }

  // 工具函数：更新元素
  private updateElement(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }
  // 工具函数：格式化速度
  private formatSpeed(bytesPerSecond: number): string {
    return formatBytes(bytesPerSecond) + '/s';
  }
}

// 导出到全局
(window as any).UIManager = UIManager;
