<template>
  <div class="card glass-card full-width">
    <div class="card-header">
      <h2 class="card-title">
        <span class="icon">🧩</span>
        进程列表
      </h2>
    </div>
    <div class="card-body">
      <div class="process-list-header">
        <span>PID</span>
        <span>进程名</span>
        <span>CPU</span>
        <span>内存</span>
      </div>
      <div class="process-list" v-if="sortedProcesses.length > 0">
        <div
          v-for="proc in sortedProcesses"
          :key="proc.pid"
          class="process-item"
          :title="proc.name || '-'"
        >
          <span class="process-pid">{{ proc.pid }}</span>
          <span class="process-name">{{ proc.name || '-' }}</span>
          <span class="process-cpu">{{ (proc.cpu || 0).toFixed(1) }}%</span>
          <span class="process-memory">{{ formatBytes(proc.memory || 0) }}</span>
        </div>
      </div>
      <div class="loading" v-else>暂无进程数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProcessInfo } from '../../types/global';
import { formatBytes } from '../utils/format';

const props = defineProps<{
  processes: ProcessInfo[];
}>();

const sortedProcesses = computed(() => {
  if (!props.processes || props.processes.length === 0) return [];
  
  return [...props.processes]
    .sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0))
    .slice(0, 50);
});
</script>

<style scoped>
/* Process List 特定样式 */
</style>
