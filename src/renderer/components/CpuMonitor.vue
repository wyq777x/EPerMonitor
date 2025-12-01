<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <dashboard-outlined style="font-size: 20px;" />
        CPU 使用率
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
          <a-statistic title="核心数" :value="cpuInfo?.cores || 0" />
        </a-col>
        <a-col :span="12">
          <a-statistic title="频率" :value="cpuInfo?.speed || 0" suffix="MHz" />
        </a-col>
        <a-col :span="24">
          <a-tooltip :title="cpuInfo?.model || '-'">
            <a-statistic title="型号" :value="cpuInfo?.model || '-'" class="model-stat" />
          </a-tooltip>
        </a-col>
        <a-col :span="24" v-if="cpuInfo?.temperature">
          <a-statistic 
            title="温度" 
            :value="cpuInfo.temperature" 
            suffix="°C"
            :value-style="{ color: cpuInfo.temperature > 70 ? '#f5576c' : '#43e97b' }"
          />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DashboardOutlined } from '@ant-design/icons-vue';
import type { CPUInfo } from '../../types/global';

const props = defineProps<{
  cpuInfo: CPUInfo | null;
}>();

const usage = computed(() => Math.round(props.cpuInfo?.usage ?? 0));

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

.card-body :deep(.model-stat .ant-statistic-content) {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Progress 样式 */
.card-body :deep(.ant-progress-text) {
  color: var(--text-primary);
  font-weight: 700;
}
</style>
