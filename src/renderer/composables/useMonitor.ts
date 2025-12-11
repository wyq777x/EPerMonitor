import { ref, onMounted, onUnmounted, toRaw } from "vue";
import { Modal, message } from "ant-design-vue";
import { h } from "vue";
import type {
  CPUInfo,
  DiskData,
  MemoryInfo,
  NetworkData,
  ProcessInfo,
  SystemInfo,
  MonitoringData,
} from "../../types/global";
import { marked } from "marked";

export function useMonitor() {
  const isMonitoring = ref(false);
  const isAnalyzing = ref(false);
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

  // AI 分析系统性能
  const analyzeWithAI = async () => {
    if (isAnalyzing.value) {
      console.log("⚠️ 正在分析中...");
      return;
    }

    if (
      !cpuInfo.value ||
      !memoryInfo.value ||
      !diskInfo.value ||
      !networkInfo.value
    ) {
      console.warn("⚠️ 没有足够的监控数据进行分析");
      message.warning("请先开始监控以收集系统数据");
      return;
    }

    // 获取API Key（优先从环境变量，其次从本地存储）
    let apiKey =
      import.meta.env.VITE_DEEPSEEK_API_KEY ||
      localStorage.getItem("deepseek_api_key");

    if (!apiKey) {
      // 显示输入对话框
      const inputValue = ref("");

      return new Promise<void>((resolve) => {
        Modal.confirm({
          title: "请输入 DeepSeek API Key",
          content: h("div", { style: "margin-top: 16px" }, [
            h("input", {
              type: "password",
              placeholder: "请输入您的 DeepSeek API Key",
              style:
                "width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 6px; background: rgba(255,255,255,0.1); color: #fff;",
              onInput: (e: Event) => {
                inputValue.value = (e.target as HTMLInputElement).value;
              },
            }),
            h(
              "p",
              {
                style:
                  "margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.5)",
              },
              "您的 API Key 将保存在本地，下次无需重复输入"
            ),
          ]),
          okText: "确认",
          cancelText: "取消",
          centered: true,
          async onOk() {
            if (inputValue.value) {
              localStorage.setItem("deepseek_api_key", inputValue.value);
              await performAnalysis(inputValue.value);
            } else {
              message.warning("未提供 API Key");
            }
            resolve();
          },
          onCancel() {
            resolve();
          },
        });
      });
    }

    await performAnalysis(apiKey);
  };

  // 执行AI分析
  const performAnalysis = async (apiKey: string) => {
    try {
      isAnalyzing.value = true;
      status.value = "AI分析中...";
      console.log("🤖 开始AI分析...");

      if (!window.electronAPI || !window.electronAPI.analyzeSystemPerformance) {
        console.warn("⚠️ AI分析API不可用");
        message.error("AI分析功能不可用");
        return;
      }

      const monitoringData: MonitoringData = {
        cpu: toRaw(cpuInfo.value!),
        memory: toRaw(memoryInfo.value!),
        disk: toRaw(diskInfo.value!),
        network: toRaw(networkInfo.value!),
        timestamp: Date.now(),
      };

      const result = await window.electronAPI.analyzeSystemPerformance(
        apiKey,
        monitoringData
      );

      if (result.success && result.analysis) {
        console.log("✅ AI分析完成");
        // 显示分析结果
        const htmlContent = marked(result.analysis) as string;
        Modal.success({
          title: "AI 分析结果",
          content: h("div", {
            style: "max-height: 400px; overflow-y: auto; line-height: 1.6;",
            innerHTML: htmlContent,
          }),
          width: 700,
          centered: true,
          okText: "关闭",
        });
      } else {
        console.error("❌ AI分析失败:", result.error);
        // 如果是 API Key 错误，清除保存的 key
        if (
          result.error?.includes("401") ||
          result.error?.includes("invalid") ||
          result.error?.includes("API")
        ) {
          localStorage.removeItem("deepseek_api_key");
        }
        message.error(`AI分析失败: ${result.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("❌ AI分析出错:", error);
      message.error(`AI分析出错: ${(error as Error).message}`);
    } finally {
      isAnalyzing.value = false;
      status.value = isMonitoring.value ? "监控中..." : "就绪";
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
    isAnalyzing,
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
    analyzeWithAI,
    loadSystemInfo,
    loadInitialData,
  };
}
