/**
 * 图表管理 - View层
 */

interface ChartData {
  cpu: number[];
  memory: number[];
  timestamps: string[];
}

export class ChartManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: ChartData;
  private maxDataPoints: number;
  private animationFrame: number|null;
  private width: number;
  private height: number;
  private padding: number;

  constructor(canvasId: string) {
    const canvas =
        document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }

    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    this.ctx = ctx;
    this.data = {cpu: [], memory: [], timestamps: []};
    this.maxDataPoints = 60;
    this.animationFrame = null;
    this.width = 0;
    this.height = 0;
    this.padding = 40;

    this.setupCanvas();
    this.startAnimation();
  }

  setupCanvas(): void {
    // 设置canvas尺寸以匹配CSS尺寸
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.width = rect.width;
    this.height = rect.height;
  }

  addData(cpu: number, memory: number): void {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${
        now.getMinutes().toString().padStart(
            2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    this.data.cpu.push(cpu);
    this.data.memory.push(memory);
    this.data.timestamps.push(time);

    // 限制数据点数量
    if (this.data.cpu.length > this.maxDataPoints) {
      this.data.cpu.shift();
      this.data.memory.shift();
      this.data.timestamps.shift();
    }
  }

  startAnimation(): void {
    const animate = (): void => {
      this.draw();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  draw(): void {
    if (!this.ctx) return;

    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 绘制背景网格
    this.drawGrid();

    // 绘制图表
    if (this.data.cpu.length > 1) {
      this.drawLine(this.data.cpu, 'rgba(102, 126, 234, 0.8)');
      this.drawLine(this.data.memory, 'rgba(79, 172, 254, 0.8)');
    }

    // 绘制坐标轴
    this.drawAxes();

    // 绘制图例
    this.drawLegend();
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    // 水平网格线
    for (let i = 0; i <= 5; i++) {
      const y = this.padding + ((this.height - 2 * this.padding) * i) / 5;
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding, y);
      this.ctx.lineTo(this.width - this.padding, y);
      this.ctx.stroke();
    }

    // 垂直网格线
    const step = Math.max(1, Math.floor(this.data.cpu.length / 10));
    for (let i = 0; i < this.data.cpu.length; i += step) {
      const x = this.padding +
          ((this.width - 2 * this.padding) * i) / (this.data.cpu.length - 1);
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding);
      this.ctx.lineTo(x, this.height - this.padding);
      this.ctx.stroke();
    }
  }

  private drawLine(data: number[], color: string): void {
    if (data.length < 2) return;

    const chartWidth = this.width - 2 * this.padding;
    const chartHeight = this.height - 2 * this.padding;

    // 创建渐变
    const gradient = this.ctx.createLinearGradient(
        0, this.padding, 0, this.height - this.padding);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color.replace('0.8', '0.2'));

    // 绘制填充区域
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.height - this.padding);

    data.forEach((value, index) => {
      const x = this.padding + (chartWidth * index) / (data.length - 1);
      const y = this.height - this.padding - (chartHeight * value) / 100;
      if (index === 0) {
        this.ctx.lineTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });

    this.ctx.lineTo(this.width - this.padding, this.height - this.padding);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // 绘制线条
    this.ctx.beginPath();
    data.forEach((value, index) => {
      const x = this.padding + (chartWidth * index) / (data.length - 1);
      const y = this.height - this.padding - (chartHeight * value) / 100;
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawAxes(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;

    // Y轴
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.padding);
    this.ctx.lineTo(this.padding, this.height - this.padding);
    this.ctx.stroke();

    // X轴
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.height - this.padding);
    this.ctx.lineTo(this.width - this.padding, this.height - this.padding);
    this.ctx.stroke();

    // Y轴标签
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = '12px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const y = this.padding + ((this.height - 2 * this.padding) * i) / 5;
      const value = 100 - (i * 100) / 5;
      this.ctx.fillText(`${value}%`, this.padding - 10, y + 4);
    }

    // X轴标签
    this.ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(this.data.timestamps.length / 6));
    for (let i = 0; i < this.data.timestamps.length; i += step) {
      const x = this.padding +
          ((this.width - 2 * this.padding) * i) /
              (this.data.timestamps.length - 1);
      this.ctx.fillText(
          this.data.timestamps[i] || '', x, this.height - this.padding + 20);
    }
  }

  private drawLegend(): void {
    const legendX = this.width - this.padding - 150;
    const legendY = this.padding + 10;

    // CPU图例
    this.ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
    this.ctx.fillRect(legendX, legendY, 20, 10);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('CPU', legendX + 25, legendY + 9);

    // 内存图例
    this.ctx.fillStyle = 'rgba(79, 172, 254, 0.8)';
    this.ctx.fillRect(legendX + 80, legendY, 20, 10);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillText('内存', legendX + 105, legendY + 9);
  }
}

// 导出到全局
(window as any).ChartManager = ChartManager;
