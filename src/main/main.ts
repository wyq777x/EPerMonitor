import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron";
import OpenAI from "openai";
import * as path from "path";

import { SystemMonitor } from "./ipc/systemMonitor";

let mainWindow: BrowserWindow | null;
let systemMonitor: SystemMonitor;

/**
 * 创建主窗口
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    transparent: false,
    backgroundColor: "#1a1a2e",
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../../assets/icon.png"),
  });

  // 加载应用
  const isDev = process.argv.includes("--dev");

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    mainWindow.loadURL("http://localhost:12304");
  } else {
    // 生产模式：加载打包后的文件
    const indexPath = path.join(__dirname, "../renderer/index.html");
    mainWindow.loadFile(indexPath);
  }

  // 开发模式下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * 应用准备就绪
 */
app.whenReady().then(() => {
  createWindow();

  // 初始化系统监控器
  systemMonitor = new SystemMonitor();
  setupIPC();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * 所有窗口关闭时退出
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (systemMonitor) {
      systemMonitor.stop();
    }
    app.quit();
  }
});

/**
 * 设置IPC通信
 */
function setupIPC(): void {
  // 获取系统信息
  ipcMain.handle("get-system-info", async () => {
    return systemMonitor.getSystemInfo();
  });

  // 获取CPU信息
  ipcMain.handle("get-cpu-info", async () => {
    return systemMonitor.getCPUInfo();
  });

  // 获取内存信息
  ipcMain.handle("get-memory-info", async () => {
    return systemMonitor.getMemoryInfo();
  });

  // 获取磁盘信息
  ipcMain.handle("get-disk-info", async () => {
    return systemMonitor.getDiskInfo();
  });

  // 获取网络信息
  ipcMain.handle("get-network-info", async () => {
    return systemMonitor.getNetworkInfo();
  });

  // 获取进程列表
  ipcMain.handle("get-process-list", async () => {
    return systemMonitor.getProcessList();
  });

  // 开始监控
  ipcMain.handle(
    "start-monitoring",
    async (_event: IpcMainInvokeEvent, interval?: number) => {
      systemMonitor.startMonitoring(interval || 1000, (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("monitoring-data", data);
        }
      });
      return { success: true };
    }
  );

  // 停止监控
  ipcMain.handle("stop-monitoring", async () => {
    try {
      systemMonitor.stopMonitoring();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // AI 分析系统性能
  ipcMain.handle(
    "analyze-system-performance",
    async (_event: IpcMainInvokeEvent, apiKey: string, data: any) => {
      try {
        const openai = new OpenAI({
          baseURL: "https://api.deepseek.com",
          apiKey: apiKey,
        });

        // 构建性能数据摘要
        const performanceSummary = `
系统性能数据:
- CPU使用率: ${data.cpu.usage.toFixed(2)}%
- CPU核心数: ${data.cpu.cores}
- CPU型号: ${data.cpu.model}
- CPU温度: ${data.cpu.temperature.toFixed(2)}°C

- 内存总量: ${(data.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
- 内存已用: ${(data.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB
- 内存空闲: ${(data.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB
- 内存使用率: ${data.memory.usagePercent.toFixed(2)}%

- 磁盘信息: ${data.disk.disks
          .map(
            (d: any) =>
              `${d.name}: ${(d.used / 1024 / 1024 / 1024).toFixed(2)}GB / ${(
                d.total /
                1024 /
                1024 /
                1024
              ).toFixed(2)}GB (${d.usagePercent.toFixed(2)}%)`
          )
          .join(", ")}

- 网络接口: ${data.network.interfaces
          .map(
            (n: any) =>
              `${n.name}: 下载速度 ${(n.rxSpeed / 1024).toFixed(
                2
              )} KB/s, 上传速度 ${(n.txSpeed / 1024).toFixed(2)} KB/s`
          )
          .join(", ")}
`;

        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "你是一个专业的系统性能分析专家。请根据提供的系统监控数据,分析系统性能状况,指出潜在问题,并给出优化建议。请用中文回答,保持专业和简洁。",
            },
            {
              role: "user",
              content: `请分析以下系统性能数据:\n\n${performanceSummary}`,
            },
          ],
          model: "deepseek-chat",
        });

        const analysis = completion.choices[0]?.message?.content || "分析失败";

        return {
          success: true,
          analysis: analysis,
        };
      } catch (error) {
        console.error("AI分析失败:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
}

/**
 * 处理未捕获的异常
 */
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error: Error) => {
  console.error("Unhandled Rejection:", error);
});
