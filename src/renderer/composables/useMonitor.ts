import { ref, onMounted, onUnmounted } from "vue";
import type {
  CPUInfo,
  DiskData,
  MemoryInfo,
  NetworkData,
  ProcessInfo,
  SystemInfo,
  MonitoringData,
} from "../../types/global";

export function useMonitor() {
  const isMonitoring = ref(false);
  const systemInfo = ref<SystemInfo | null>(null);
  const cpuInfo = ref<CPUInfo | null>(null);
  const memoryInfo = ref<MemoryInfo | null>(null);
  const diskInfo = ref<DiskData | null>(null);
  const networkInfo = ref<NetworkData | null>(null);
  const processInfo = ref<ProcessInfo[]>([]);
  const status = ref("就绪");
  const uptime = ref(0);
  const updateInterval = 1000;
  const processUpdateInterval = 5000;

  let processTimer: number | null = null;

  // 加载系统信息
  const loadSystemInfo = async () => {
    try {
      if (!window.electronAPI) {
        console.warn("⚠️ Electron API 不可用");
        return;
      }

      const info = await window.electronAPI.getSystemInfo();
      systemInfo.value = info;
      uptime.value = info.uptime;
      console.log("📊 系统信息已加载:", info);
    } catch (error) {
      console.error("❌ 加载系统信息失败:", error);
    }
  };

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      if (!window.electronAPI) {
        console.warn("⚠️ Electron API 不可用");
        return;
      }

      const [cpu, memory, disk, network] = await Promise.all([
        window.electronAPI.getCPUInfo(),
        window.electronAPI.getMemoryInfo(),
        window.electronAPI.getDiskInfo(),
        window.electronAPI.getNetworkInfo(),
      ]);

      cpuInfo.value = cpu;
      memoryInfo.value = memory;
      diskInfo.value = disk;
      networkInfo.value = network;

      console.log("✅ 初始数据加载完成");
    } catch (error) {
      console.error("❌ 加载初始数据失败:", error);
    }
  };

  // 加载进程列表
  const loadProcessList = async () => {
    try {
      if (!window.electronAPI || !window.electronAPI.getProcessList) {
        return;
      }

      const processes = await window.electronAPI.getProcessList();
      processInfo.value = processes;
    } catch (error) {
      console.error("❌ 加载进程列表失败:", error);
    }
  };

  // 启动进程轮询
  const startProcessPolling = () => {
    if (processTimer) return;

    loadProcessList();
    processTimer = window.setInterval(() => {
      loadProcessList();
    }, processUpdateInterval);
  };

  // 停止进程轮询
  const stopProcessPolling = () => {
    if (processTimer) {
      clearInterval(processTimer);
      processTimer = null;
    }
  };

  // 开始监控
  const startMonitoring = async () => {
    if (isMonitoring.value) {
      console.log("⚠️ 监控已在运行");
      return;
    }

    try {
      console.log("▶️ 开始监控...");

      if (!window.electronAPI) {
        console.warn("⚠️ Electron API 不可用");
        return;
      }

      await window.electronAPI.startMonitoring(updateInterval);
      isMonitoring.value = true;
      status.value = "监控中...";

      console.log("✅ 监控已启动");
    } catch (error) {
      console.error("❌ 启动监控失败:", error);
    }
  };

  // 停止监控
  const stopMonitoring = async () => {
    if (!isMonitoring.value) {
      console.log("⚠️ 监控未运行");
      return;
    }

    try {
      console.log("⏸️ 停止监控...");

      if (window.electronAPI) {
        await window.electronAPI.stopMonitoring();
      }

      isMonitoring.value = false;
      status.value = "已停止";

      console.log("✅ 监控已停止");
    } catch (error) {
      console.error("❌ 停止监控失败:", error);
    }
  };

  // 处理监控数据更新
  const handleMonitoringData = (data: MonitoringData) => {
    cpuInfo.value = data.cpu;
    memoryInfo.value = data.memory;
    diskInfo.value = data.disk;
    networkInfo.value = data.network;
  };

  // 初始化
  onMounted(() => {
    loadSystemInfo();
    loadInitialData();
    startProcessPolling();

    // 监听来自主进程的数据
    if (window.electronAPI && window.electronAPI.onMonitoringData) {
      window.electronAPI.onMonitoringData(handleMonitoringData);
    }
  });

  // 清理
  onUnmounted(() => {
    stopProcessPolling();
  });

  return {
    isMonitoring,
    systemInfo,
    cpuInfo,
    memoryInfo,
    diskInfo,
    networkInfo,
    processInfo,
    status,
    uptime,
    startMonitoring,
    stopMonitoring,
    loadSystemInfo,
    loadInitialData,
  };
}
