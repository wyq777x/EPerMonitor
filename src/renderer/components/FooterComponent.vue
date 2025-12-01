<template>
  <footer class="footer">
    <div class="footer-content">
      <a-space :size="24">
        <a-statistic title="运行时间" :value="formattedUptime" class="footer-stat">
          <template #prefix>
            <clock-circle-outlined />
          </template>
        </a-statistic>
        <a-statistic title="更新间隔" value="1000ms" class="footer-stat">
          <template #prefix>
            <sync-outlined />
          </template>
        </a-statistic>
        <a-statistic title="状态" :value="status" class="footer-stat">
          <template #prefix>
            <api-outlined />
          </template>
        </a-statistic>
      </a-space>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ClockCircleOutlined, SyncOutlined, ApiOutlined } from '@ant-design/icons-vue';
import { formatUptime } from '../utils/format';

const props = defineProps<{
  status: string;
  uptime: number;
}>();

const formattedUptime = computed(() => {
  return props.uptime > 0 ? formatUptime(props.uptime) : '-';
});
</script>

<style scoped>
.footer {
  position: relative;
  z-index: 10;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--glass-border);
  padding: var(--spacing-md) var(--spacing-xl);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-stat :deep(.ant-statistic) {
  text-align: center;
}

.footer-stat :deep(.ant-statistic-title) {
  color: var(--text-muted);
  font-size: 12px;
  margin-bottom: 4px;
}

.footer-stat :deep(.ant-statistic-content) {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.footer-stat :deep(.ant-statistic-content-prefix) {
  margin-right: 6px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
