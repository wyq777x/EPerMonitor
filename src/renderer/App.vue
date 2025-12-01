<template>
  <div class="app-container">
    <!-- 背景动画 -->
    <div class="animated-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- 顶部栏 -->
    <HeaderComponent
      :system-info="systemInfo"
      :is-monitoring="isMonitoring"
      @start-monitoring="startMonitoring"
      @stop-monitoring="stopMonitoring"
    />

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- CPU 监控卡片 -->
      <CpuMonitor :cpu-info="cpuInfo" />

      <!-- 内存监控卡片 -->
      <MemoryMonitor :memory-info="memoryInfo" />

      <!-- 磁盘监控卡片 -->
      <DiskMonitor :disk-info="diskInfo" />

      <!-- 网络监控卡片 -->
      <NetworkMonitor :network-info="networkInfo" />

      <!-- 进程列表卡片 -->
      <ProcessList :processes="processInfo" />

      <!-- 实时图表卡片 -->
      <ChartComponent
        :cpu-usage="cpuInfo?.usage || 0"
        :memory-usage="memoryInfo?.usagePercent || 0"
      />
    </main>

    <!-- 底部状态栏 -->
    <FooterComponent :status="status" :uptime="uptime" />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useMonitor } from './composables/useMonitor';
import HeaderComponent from './components/HeaderComponent.vue';
import CpuMonitor from './components/CpuMonitor.vue';
import MemoryMonitor from './components/MemoryMonitor.vue';
import DiskMonitor from './components/DiskMonitor.vue';
import NetworkMonitor from './components/NetworkMonitor.vue';
import ProcessList from './components/ProcessList.vue';
import ChartComponent from './components/ChartComponent.vue';
import FooterComponent from './components/FooterComponent.vue';

const {
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
  stopMonitoring
} = useMonitor();

// 监听 CPU 和内存数据的变化
watch([cpuInfo, memoryInfo], () => {
  // 数据更新会自动传递给子组件
});
</script>

<style scoped>
/* App 特定样式 */
</style>
