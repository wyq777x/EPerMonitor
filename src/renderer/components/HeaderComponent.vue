<template>
  <header class="header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="app-title">
          <span class="icon">📊</span>
          EPM Better
        </h1>
        <div class="system-info" v-if="systemInfo">
          <span>{{ systemInfo.hostname }} | {{ systemInfo.platform }} {{ systemInfo.arch }}</span>
        </div>
        <div class="system-info" v-else>
          <span>加载中...</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" v-if="!isMonitoring" @click="$emit('start-monitoring')">
          <span class="icon">▶️</span>
          开始监控
        </button>
        <button class="btn btn-secondary" v-if="isMonitoring" @click="$emit('stop-monitoring')">
          <span class="icon">⏸️</span>
          停止监控
        </button>
        <button class="btn btn-success" v-if="isMonitoring">
          <span class="icon">🤖</span>
          AI分析
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { SystemInfo } from '../../types/global';

defineProps<{
  systemInfo: SystemInfo | null;
  isMonitoring: boolean;
}>();

defineEmits<{
  (e: 'start-monitoring'): void;
  (e: 'stop-monitoring'): void;
}>();
</script>

<style scoped>
/* Header 特定样式 */
</style>
