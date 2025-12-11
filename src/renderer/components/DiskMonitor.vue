<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <hdd-outlined style="font-size: 20px;" />
        磁盘状态
      </h2>
    </div>
    <div class="card-body">
      <a-list
        v-if="diskInfo && diskInfo.disks && diskInfo.disks.length > 0"
        :data-source="diskInfo.disks"
        :loading="false"
      >
        <template #renderItem="{ item, index }">
          <a-list-item :key="index" class="disk-item">
            <a-list-item-meta>
              <template #title>
                <a-space>
                  <a-tag class="disk-tag">{{ item.name || '未知' }}</a-tag>
                  <a-tag class="disk-tag">
                    {{ Math.round(item.usagePercent || 0) }}%
                  </a-tag>
                </a-space>
              </template>
              <template #description>
                <div class="disk-progress-section">
                  <a-progress 
                    :percent="Math.round(item.usagePercent || 0)" 
                    :stroke-color="getProgressColor(item.usagePercent || 0)"
                    :trail-color="'rgba(255, 255, 255, 0.1)'"
                  />
                  <a-space class="disk-stats" :size="16">
                    <span>
                      <small style="color: var(--text-muted)">已用:</small>
                      <strong>{{ formatBytes(item.used || 0) }}</strong>
                    </span>
                    <span>
                      <small style="color: var(--text-muted)">可用:</small>
                      <strong>{{ formatBytes(item.free || 0) }}</strong>
                    </span>
                    <span>
                      <small style="color: var(--text-muted)">总计:</small>
                      <strong>{{ formatBytes(item.total || 0) }}</strong>
                    </span>
                  </a-space>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
      <a-empty v-else description="暂无磁盘数据" :image="simpleImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { HddOutlined } from '@ant-design/icons-vue';
import { Empty } from 'ant-design-vue';
import type { DiskData } from '../../types/global';
import { formatBytes } from '../utils/format';

defineProps<{
  diskInfo: DiskData | null;
}>();

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;

const getProgressColor = (percent: number) => {
  if (percent >= 80) return '#f5576c';
  if (percent >= 60) return '#fee140';
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

.disk-progress-section {
  margin-top: var(--spacing-sm);
}

.disk-stats {
  margin-top: var(--spacing-md);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.disk-stats span {
  display: flex;
  flex-direction: column;
  color: var(--text-primary);
}

.disk-stats small {
  font-size: 11px;
  margin-bottom: 2px;
}

/* Ant Design List 样式覆盖 */
.card-body :deep(.ant-list) {
  color: var(--text-primary);
}

.card-body :deep(.ant-list-item) {
  border-bottom: 1px solid var(--glass-border);
  padding: var(--spacing-md) 0;
  transition: var(--transition);
}

.card-body :deep(.ant-list-item:last-child) {
  border-bottom: none;
}

.card-body :deep(.ant-list-item:hover) {
  background: rgba(255, 255, 255, 0.03);
  padding-left: var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.card-body :deep(.ant-list-item-meta-title) {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.card-body :deep(.ant-list-item-meta-description) {
  color: var(--text-secondary);
}

/* Progress 样式 */
.card-body :deep(.ant-progress-text) {
  color: var(--text-primary);
}

.card-body :deep(.ant-empty) {
  color: var(--text-muted);
}

.card-body :deep(.ant-empty-description) {
  color: var(--text-muted);
}

/* Tag 样式美化 */
.card-body :deep(.disk-tag) {
  background: var(--glass-bg);
  border-color: var(--glass-border);
  backdrop-filter: blur(10px);
  color: var(--text-primary);
}
</style>
