<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="icon">💾</span>
        内存使用
      </h2>
      <div class="card-actions">
        <span class="badge" :style="badgeStyle">{{ usage }}%</span>
      </div>
    </div>
    <div class="card-body">
      <div class="progress-ring">
        <svg width="120" height="120">
          <circle class="progress-ring-circle-bg" cx="60" cy="60" r="52" />
          <circle
            class="progress-ring-circle"
            cx="60"
            cy="60"
            r="52"
            :style="circleStyle"
          />
          <text x="60" y="60" class="progress-text">{{ usage }}%</text>
        </svg>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">总计</span>
          <span class="info-value">{{ formatBytes(memoryInfo?.total || 0) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">已用</span>
          <span class="info-value">{{ formatBytes(memoryInfo?.used || 0) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">可用</span>
          <span class="info-value">{{ formatBytes(memoryInfo?.free || 0) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">使用率</span>
          <span class="info-value">{{ usagePercent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MemoryInfo } from '../../types/global';
import { formatBytes } from '../utils/format';

const props = defineProps<{
  memoryInfo: MemoryInfo | null;
}>();

const usage = computed(() => Math.round(props.memoryInfo?.usagePercent ?? 0));
const usagePercent = computed(() => (props.memoryInfo?.usagePercent ?? 0).toFixed(1));

const circleStyle = computed(() => {
  const percent = usage.value;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  let color = '#43e97b';
  if (percent >= 80) color = '#f5576c';
  else if (percent >= 50) color = '#fee140';

  return {
    strokeDashoffset: offset.toString(),
    stroke: color
  };
});

const badgeStyle = computed(() => {
  const percent = usage.value;
  const background = percent > 80 ? 'var(--gradient-2)' : 'var(--gradient-3)';
  return { background };
});
</script>

<style scoped>
/* Memory Monitor 特定样式 */
</style>
