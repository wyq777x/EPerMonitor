import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron";
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
  const indexPath = isDev
    ? path.join(__dirname, "../../src/renderer/index.html")
    : path.join(__dirname, "../renderer/index.html");

  mainWindow.loadFile(indexPath);

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
    },
  );

  // 停止监控
  ipcMain.handle('stop-monitoring', async () => {
    try {
      systemMonitor.stopMonitoring();
      return {success: true};
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
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
