import { ref, onMounted, onUnmounted } from "vue";

interface ChartData {
  cpu: number[];
  memory: number[];
  timestamps: string[];
}

export function useChart() {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const maxDataPoints = 60;
  const data = ref<ChartData>({
    cpu: [],
    memory: [],
    timestamps: [],
  });

  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number | null = null;
  let width = 0;
  let height = 0;
  const padding = 40;

  const setupCanvas = () => {
    if (!canvasRef.value) return;

    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;

    ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelRatio, pixelRatio);
    }

    width = rect.width;
    height = rect.height;
  };

  const addData = (cpu: number, memory: number) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    data.value.cpu.push(cpu);
    data.value.memory.push(memory);
    data.value.timestamps.push(time);

    if (data.value.cpu.length > maxDataPoints) {
      data.value.cpu.shift();
      data.value.memory.shift();
      data.value.timestamps.shift();
    }
  };

  const drawGrid = () => {
    if (!ctx) return;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    const innerHeight = height - 2 * padding;
    const innerWidth = width - 2 * padding;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (innerHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    if (data.value.cpu.length > 1) {
      const step = Math.max(1, Math.floor(data.value.cpu.length / 10));
      for (let i = 0; i < data.value.cpu.length; i += step) {
        const x = padding + (innerWidth * i) / (data.value.cpu.length - 1);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }
    }
  };

  const drawSeries = (
    seriesData: number[],
    color: string,
    fillColor: string
  ) => {
    if (!ctx || seriesData.length < 2) return;

    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, fillColor);

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    seriesData.forEach((value, index) => {
      const x = padding + (chartWidth * index) / (seriesData.length - 1);
      const y = height - padding - (chartHeight * value) / 100;
      ctx!.lineTo(x, y);
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    seriesData.forEach((value, index) => {
      const x = padding + (chartWidth * index) / (seriesData.length - 1);
      const y = height - padding - (chartHeight * value) / 100;
      if (index === 0) {
        ctx!.moveTo(x, y);
      } else {
        ctx!.lineTo(x, y);
      }
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawAxes = () => {
    if (!ctx) return;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = "right";

    for (let i = 0; i <= 5; i++) {
      const y = padding + ((height - 2 * padding) * i) / 5;
      const value = 100 - (i * 100) / 5;
      ctx.fillText(`${Math.round(value)}%`, padding - 10, y + 4);
    }

    ctx.textAlign = "center";
    if (data.value.timestamps.length > 0) {
      const step = Math.max(1, Math.floor(data.value.timestamps.length / 6));
      for (let i = 0; i < data.value.timestamps.length; i += step) {
        const count = data.value.timestamps.length - 1;
        if (count > 0) {
          const x = padding + ((width - 2 * padding) * i) / count;
          ctx.fillText(
            data.value.timestamps[i] || "",
            x,
            height - padding + 20
          );
        }
      }
    }
  };

  const drawLegend = () => {
    if (!ctx) return;

    const legendItems = [
      { label: "CPU", color: "rgba(102, 126, 234, 0.8)" },
      { label: "内存", color: "rgba(79, 172, 254, 0.8)" },
    ];

    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    let x = width - padding - 150;
    const y = padding + 10;

    legendItems.forEach((item) => {
      ctx!.fillStyle = item.color;
      ctx!.fillRect(x, y, 20, 10);

      ctx!.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx!.fillText(item.label, x + 25, y + 5);

      x += 80;
    });
  };

  const draw = () => {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawGrid();

    if (data.value.cpu.length > 1) {
      drawSeries(
        data.value.cpu,
        "rgba(102, 126, 234, 0.8)",
        "rgba(102, 126, 234, 0.2)"
      );
      drawSeries(
        data.value.memory,
        "rgba(79, 172, 254, 0.8)",
        "rgba(79, 172, 254, 0.2)"
      );
    }

    drawAxes();
    drawLegend();
  };

  const startAnimation = () => {
    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopAnimation = () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };

  const handleResize = () => {
    setupCanvas();
  };

  onMounted(() => {
    setupCanvas();
    startAnimation();
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    stopAnimation();
    window.removeEventListener("resize", handleResize);
  });

  return {
    canvasRef,
    addData,
    setupCanvas,
  };
}
