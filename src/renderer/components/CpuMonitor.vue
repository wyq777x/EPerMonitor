<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="icon">🖥️</span>
        CPU 使用率
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
          <span class="info-label">核心数</span>
          <span class="info-value">{{ cpuInfo?.cores || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">频率</span>
          <span class="info-value">{{ cpuInfo?.speed ? `${cpuInfo.speed} MHz` : '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">型号</span>
          <span class="info-value" :title="cpuInfo?.model || ''">
            {{ cpuInfo?.model || '-' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">温度</span>
          <span class="info-value">
            {{ cpuInfo?.temperature ? `${cpuInfo.temperature}°C` : '-' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CPUInfo } from '../../types/global';

const props = defineProps<{
  cpuInfo: CPUInfo | null;
}>();

const usage = computed(() => Math.round(props.cpuInfo?.usage ?? 0));

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
/* CPU Monitor 特定样式 */
</style>
