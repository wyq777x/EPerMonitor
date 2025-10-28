/**
 * 图表管理 - View层
 */

interface ChartData {
  cpu: number[];
  memory: number[];
  timestamps: string[];
}

const METRIC_SERIES_KEYS = ['cpu', 'memory'] as const;
type MetricSeriesKey = typeof METRIC_SERIES_KEYS[number];

interface ChartSeriesStyle {
  lineColor: string;
  fillColor: string;
  legendColor: string;
  label: string;
  lineWidth: number;
}

interface ChartGridTheme {
  color: string;
  lineWidth: number;
  horizontalLines: number;
  verticalDensity: number;
}

interface ChartAxisTheme {
  color: string;
  lineWidth: number;
  labelColor: string;
  font: string;
  yLabelXOffset: number;
  yLabelYOffset: number;
  xLabelYOffset: number;
}

interface ChartLegendTheme {
  textColor: string;
  font: string;
  rightOffset: number;
  topOffset: number;
  boxWidth: number;
  boxHeight: number;
  labelSpacing: number;
  itemGap: number;
}

interface ChartTheme {
  layout: {padding: number};
  grid: ChartGridTheme;
  axes: ChartAxisTheme;
  legend: ChartLegendTheme;
  series: Record<MetricSeriesKey, ChartSeriesStyle>;
}

const DEFAULT_THEME: ChartTheme = {
  layout: {padding: 40},
  grid: {
    color: 'rgba(255, 255, 255, 0.05)',
    lineWidth: 1,
    horizontalLines: 5,
    verticalDensity: 10,
  },
  axes: {
    color: 'rgba(255, 255, 255, 0.3)',
    lineWidth: 2,
    labelColor: 'rgba(255, 255, 255, 0.6)',
    font: '12px "Segoe UI", sans-serif',
    yLabelXOffset: 10,
    yLabelYOffset: 4,
    xLabelYOffset: 20,
  },
  legend: {
    textColor: 'rgba(255, 255, 255, 0.9)',
    font: '14px "Segoe UI", sans-serif',
    rightOffset: 150,
    topOffset: 10,
    boxWidth: 20,
    boxHeight: 10,
    labelSpacing: 5,
    itemGap: 80,
  },
  series: {
    cpu: {
      lineColor: 'rgba(102, 126, 234, 0.8)',
      fillColor: 'rgba(102, 126, 234, 0.2)',
      legendColor: 'rgba(102, 126, 234, 0.8)',
      label: 'CPU',
      lineWidth: 2,
    },
    memory: {
      lineColor: 'rgba(79, 172, 254, 0.8)',
      fillColor: 'rgba(79, 172, 254, 0.2)',
      legendColor: 'rgba(79, 172, 254, 0.8)',
      label: '内存',
      lineWidth: 2,
    },
  },
};

const stripWrappingQuotes = (value: string): string =>
    value.replace(/^['"]|['"]$/g, '');

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const withAlpha = (color: string, alpha: number): string => {
  if (!Number.isFinite(alpha)) {
    return color;
  }

  if (color.startsWith('rgba')) {
    return color.replace(/rgba\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(',').map((part: string) => part.trim());
      if (parts.length === 4) {
        parts[3] = alpha.toString();
        return `rgba(${parts.join(', ')})`;
      }
      if (parts.length === 3) {
        return `rgba(${parts.join(', ')}, ${alpha})`;
      }
      return color;
    });
  }

  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }

  return color;
};

const createChartTheme = (canvas: HTMLCanvasElement): ChartTheme => {
  const elementStyles = getComputedStyle(canvas);
  const rootStyles = getComputedStyle(document.documentElement);

  const getCssVar = (name: string): string =>
      elementStyles.getPropertyValue(name).trim() ||
      rootStyles.getPropertyValue(name).trim();

  const getString =
      (name: string, fallback: string, stripQuotes = false): string => {
        const value = getCssVar(name);
        if (!value) return fallback;
        return stripQuotes ? stripWrappingQuotes(value) : value;
      };

  const getNumber = (name: string, fallback: number): number => {
    const value = getCssVar(name);
    if (!value) return fallback;
    return toNumber(value, fallback);
  };

  const theme: ChartTheme = {
    layout: {
      padding: getNumber('--chart-padding', DEFAULT_THEME.layout.padding),
    },
    grid: {
      color: getString('--chart-grid-color', DEFAULT_THEME.grid.color),
      lineWidth:
          getNumber('--chart-grid-line-width', DEFAULT_THEME.grid.lineWidth),
      horizontalLines: getNumber(
          '--chart-grid-horizontal-lines', DEFAULT_THEME.grid.horizontalLines),
      verticalDensity: getNumber(
          '--chart-grid-vertical-density', DEFAULT_THEME.grid.verticalDensity),
    },
    axes: {
      color: getString('--chart-axis-color', DEFAULT_THEME.axes.color),
      lineWidth:
          getNumber('--chart-axis-line-width', DEFAULT_THEME.axes.lineWidth),
      labelColor:
          getString('--chart-axis-label-color', DEFAULT_THEME.axes.labelColor),
      font: getString('--chart-axis-font', DEFAULT_THEME.axes.font),
      yLabelXOffset: getNumber(
          '--chart-axis-y-label-x-offset', DEFAULT_THEME.axes.yLabelXOffset),
      yLabelYOffset: getNumber(
          '--chart-axis-y-label-y-offset', DEFAULT_THEME.axes.yLabelYOffset),
      xLabelYOffset: getNumber(
          '--chart-axis-x-label-y-offset', DEFAULT_THEME.axes.xLabelYOffset),
    },
    legend: {
      textColor: getString(
          '--chart-legend-text-color', DEFAULT_THEME.legend.textColor),
      font: getString('--chart-legend-font', DEFAULT_THEME.legend.font),
      rightOffset: getNumber(
          '--chart-legend-right-offset', DEFAULT_THEME.legend.rightOffset),
      topOffset: getNumber(
          '--chart-legend-top-offset', DEFAULT_THEME.legend.topOffset),
      boxWidth:
          getNumber('--chart-legend-box-width', DEFAULT_THEME.legend.boxWidth),
      boxHeight: getNumber(
          '--chart-legend-box-height', DEFAULT_THEME.legend.boxHeight),
      labelSpacing: getNumber(
          '--chart-legend-label-spacing', DEFAULT_THEME.legend.labelSpacing),
      itemGap:
          getNumber('--chart-legend-item-gap', DEFAULT_THEME.legend.itemGap),
    },
    series: {...DEFAULT_THEME.series},
  };

  for (const key of METRIC_SERIES_KEYS) {
    const defaults = DEFAULT_THEME.series[key];
    const lineColor =
        getString(`--chart-series-${key}-line-color`, defaults.lineColor);
    const fillSource =
        getString(`--chart-series-${key}-fill-color`, defaults.fillColor);
    const legendColor =
        getString(`--chart-series-${key}-legend-color`, defaults.legendColor);
    const label = getString(
        `--chart-series-${key}-label`, defaults.label, true /* stripQuotes */);
    const lineWidth =
        getNumber(`--chart-series-${key}-line-width`, defaults.lineWidth);

    theme.series[key] = {
      lineColor,
      fillColor: fillSource || withAlpha(lineColor, 0.2),
      legendColor: legendColor || lineColor,
      label,
      lineWidth,
    };
  }

  return theme;
};

export class ChartManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: ChartData;
  private maxDataPoints: number;
  private animationFrame: number|null;
  private width: number;
  private height: number;
  private padding: number;
  private theme: ChartTheme;
  private lastThemeRefresh: number;
  private readonly themeRefreshInterval: number;

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
    this.padding = DEFAULT_THEME.layout.padding;
    this.theme = DEFAULT_THEME;
    this.lastThemeRefresh = 0;
    this.themeRefreshInterval = 1000;

    this.setupCanvas();
    this.refreshTheme(true);
    this.startAnimation();
  }

  setupCanvas(): void {
    // 设置canvas尺寸以匹配CSS尺寸
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * pixelRatio;
    this.canvas.height = rect.height * pixelRatio;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(pixelRatio, pixelRatio);

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

  private refreshTheme(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastThemeRefresh < this.themeRefreshInterval) {
      return;
    }

    this.theme = createChartTheme(this.canvas);
    this.padding = this.theme.layout.padding;
    this.lastThemeRefresh = now;
  }

  draw(): void {
    if (!this.ctx) return;

    this.refreshTheme();

    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 绘制背景网格
    this.drawGrid();

    // 绘制图表
    if (this.data.cpu.length > 1) {
      for (const key of METRIC_SERIES_KEYS) {
        this.drawSeries(key, this.data[key]);
      }
    }

    // 绘制坐标轴
    this.drawAxes();

    // 绘制图例
    this.drawLegend();
  }

  private drawGrid(): void {
    const {grid} = this.theme;
    this.ctx.strokeStyle = grid.color;
    this.ctx.lineWidth = grid.lineWidth;

    const padding = this.padding;
    const innerHeight = this.height - 2 * padding;
    const innerWidth = this.width - 2 * padding;
    const horizontalSegments = Math.max(1, Math.round(grid.horizontalLines));

    for (let i = 0; i <= horizontalSegments; i++) {
      const y = padding + (innerHeight * i) / horizontalSegments;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(this.width - padding, y);
      this.ctx.stroke();
    }

    const verticalDensity = Math.max(1, Math.round(grid.verticalDensity));
    const step =
        Math.max(1, Math.floor(this.data.cpu.length / verticalDensity));

    for (let i = 0; i < this.data.cpu.length; i += step) {
      if (this.data.cpu.length < 2) break;
      const x = padding + (innerWidth * i) / (this.data.cpu.length - 1);
      this.ctx.beginPath();
      this.ctx.moveTo(x, padding);
      this.ctx.lineTo(x, this.height - padding);
      this.ctx.stroke();
    }
  }

  private drawSeries(key: MetricSeriesKey, data: number[]): void {
    if (data.length < 2) return;

    const series = this.theme.series[key];
    const padding = this.padding;
    const chartWidth = this.width - 2 * padding;
    const chartHeight = this.height - 2 * padding;

    const gradient =
        this.ctx.createLinearGradient(0, padding, 0, this.height - padding);
    gradient.addColorStop(0, series.lineColor);
    gradient.addColorStop(
        1, series.fillColor || withAlpha(series.lineColor, 0.2));

    this.ctx.beginPath();
    this.ctx.moveTo(padding, this.height - padding);

    data.forEach((value, index) => {
      const x = padding + (chartWidth * index) / (data.length - 1);
      const y = this.height - padding - (chartHeight * value) / 100;
      this.ctx.lineTo(x, y);
    });

    this.ctx.lineTo(this.width - padding, this.height - padding);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + (chartWidth * index) / (data.length - 1);
      const y = this.height - padding - (chartHeight * value) / 100;
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });

    this.ctx.strokeStyle = series.lineColor;
    this.ctx.lineWidth = series.lineWidth;
    this.ctx.stroke();
  }

  private drawAxes(): void {
    const {axes, grid} = this.theme;
    const padding = this.padding;

    this.ctx.strokeStyle = axes.color;
    this.ctx.lineWidth = axes.lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, this.height - padding);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(padding, this.height - padding);
    this.ctx.lineTo(this.width - padding, this.height - padding);
    this.ctx.stroke();

    this.ctx.fillStyle = axes.labelColor;
    this.ctx.font = axes.font;
    this.ctx.textAlign = 'right';

    const segments = Math.max(1, Math.round(grid.horizontalLines));
    for (let i = 0; i <= segments; i++) {
      const y = padding + ((this.height - 2 * padding) * i) / segments;
      const value = 100 - (i * 100) / segments;
      this.ctx.fillText(
          `${Math.round(value)}%`, padding - axes.yLabelXOffset,
          y + axes.yLabelYOffset);
    }

    this.ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(this.data.timestamps.length / 6));
    for (let i = 0; i < this.data.timestamps.length; i += step) {
      const count = this.data.timestamps.length - 1;
      if (count <= 0) break;
      const x = padding + ((this.width - 2 * padding) * i) / count;
      this.ctx.fillText(
          this.data.timestamps[i] || '', x,
          this.height - padding + axes.xLabelYOffset);
    }
  }

  private drawLegend(): void {
    const {legend} = this.theme;
    const padding = this.padding;
    let currentX = this.width - padding - legend.rightOffset;
    const baseY = padding + legend.topOffset;

    const previousBaseline = this.ctx.textBaseline;
    this.ctx.font = legend.font;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = legend.textColor;

    for (const key of METRIC_SERIES_KEYS) {
      const series = this.theme.series[key];
      this.ctx.fillStyle = series.legendColor;
      this.ctx.fillRect(currentX, baseY, legend.boxWidth, legend.boxHeight);

      this.ctx.fillStyle = legend.textColor;
      this.ctx.fillText(
          series.label, currentX + legend.boxWidth + legend.labelSpacing,
          baseY + legend.boxHeight / 2);

      currentX += legend.boxWidth + legend.labelSpacing + legend.itemGap;
    }

    this.ctx.textBaseline = previousBaseline;
  }
}

// 导出到全局
(window as any).ChartManager = ChartManager;
