<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <database-outlined style="font-size: 20px;" />
        内存使用
      </h2>
      <div class="card-actions">
        <a-tag :color="getStatusColor(usage)">{{ usage }}%</a-tag>
      </div>
    </div>
    <div class="card-body">
      <div class="progress-container">
        <a-progress
          type="circle"
          :percent="usage"
          :width="120"
          :stroke-color="getProgressColor(usage)"
          :trail-color="'rgba(255, 255, 255, 0.1)'"
        />
      </div>
      <a-row :gutter="[16, 16]" class="stats-grid">
        <a-col :span="12">
          <a-statistic title="总计" :value="formatBytes(memoryInfo?.total || 0)" />
        </a-col>
        <a-col :span="12">
          <a-statistic title="已用" :value="formatBytes(memoryInfo?.used || 0)" />
        </a-col>
        <a-col :span="12">
          <a-statistic title="可用" :value="formatBytes(memoryInfo?.free || 0)" />
        </a-col>
        <a-col :span="12">
          <a-statistic 
            title="使用率" 
            :value="usagePercent" 
            suffix="%"
            :value-style="{ color: getProgressColor(usage) }"
          />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DatabaseOutlined } from '@ant-design/icons-vue';
import type { MemoryInfo } from '../../types/global';
import { formatBytes } from '../utils/format';

const props = defineProps<{
  memoryInfo: MemoryInfo | null;
}>();

const usage = computed(() => Math.round(props.memoryInfo?.usagePercent ?? 0));
const usagePercent = computed(() => (props.memoryInfo?.usagePercent ?? 0).toFixed(1));

const getStatusColor = (percent: number) => {
  if (percent >= 80) return 'red';
  if (percent >= 50) return 'orange';
  return 'green';
};

const getProgressColor = (percent: number) => {
  if (percent >= 80) return '#f5576c';
  if (percent >= 50) return '#fee140';
  return '#43e97b';
};
</script>

<style scoped>
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--glass-shadow);
  transition: var(--transition);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
}

.card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
}

.card-body {
  padding: var(--spacing-lg);
}

.progress-container {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.stats-grid {
  margin-top: var(--spacing-md);
}

/* Ant Design 统计组件样式覆盖 */
.card-body :deep(.ant-statistic) {
  text-align: center;
}

.card-body :deep(.ant-statistic-title) {
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-body :deep(.ant-statistic-content) {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

/* Progress 样式 */
.card-body :deep(.ant-progress-text) {
  color: var(--text-primary);
  font-weight: 700;
}
</style>
