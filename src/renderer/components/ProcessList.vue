<template>
  <div class="card glass-card full-width">
    <div class="card-header">
      <h2 class="card-title">
        <span class="icon">🧩</span>
        进程列表
      </h2>
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索进程名称或PID"
        style="width: 300px"
        allow-clear
      />
    </div>
    <div class="card-body">
      <a-table
        :columns="columns"
        :data-source="filteredProcesses"
        :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 个进程` }"
        :scroll="{ x: 800 }"
        :loading="sortedProcesses.length === 0"
        row-key="pid"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a-tooltip :title="record.name">
              <span class="process-name-cell">{{ record.name || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'cpu'">
            <span class="cpu-tag" :style="getCpuTagStyle(record.cpu)">
              {{ (record.cpu || 0).toFixed(1) }}%
            </span>
          </template>
          <template v-else-if="column.key === 'memory'">
            <span>{{ formatBytes(record.memory || 0) }}</span>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ProcessInfo } from '../../types/global';
import { formatBytes } from '../utils/format';

const props = defineProps<{
  processes: ProcessInfo[];
}>();

const searchText = ref('');

const columns = [
  {
    title: 'PID',
    dataIndex: 'pid',
    key: 'pid',
    width: 100,
    sorter: (a: ProcessInfo, b: ProcessInfo) => a.pid - b.pid,
  },
  {
    title: '进程名',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    sorter: (a: ProcessInfo, b: ProcessInfo) => (a.name || '').localeCompare(b.name || ''),
  },
  {
    title: 'CPU使用率',
    dataIndex: 'cpu',
    key: 'cpu',
    width: 120,
    sorter: (a: ProcessInfo, b: ProcessInfo) => (a.cpu || 0) - (b.cpu || 0),
    defaultSortOrder: 'descend' as const,
  },
  {
    title: '内存使用',
    dataIndex: 'memory',
    key: 'memory',
    width: 130,
    sorter: (a: ProcessInfo, b: ProcessInfo) => (a.memory || 0) - (b.memory || 0),
  },
];

const sortedProcesses = computed(() => {
  if (!props.processes || props.processes.length === 0) return [];
  
  return [...props.processes]
    .sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0))
    .slice(0, 100);
});

const filteredProcesses = computed(() => {
  if (!searchText.value) return sortedProcesses.value;
  
  const search = searchText.value.toLowerCase();
  return sortedProcesses.value.filter(proc => 
    proc.name?.toLowerCase().includes(search) || 
    proc.pid.toString().includes(search)
  );
});

const getCpuTagStyle = (cpu: number | undefined) => {
  if (!cpu) return { background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'rgba(255, 255, 255, 0.7)' };
  if (cpu >= 50) return { background: 'rgba(245, 87, 108, 0.2)', border: '1px solid rgba(245, 87, 108, 0.4)', color: '#f5576c' };
  if (cpu >= 20) return { background: 'rgba(255, 170, 0, 0.2)', border: '1px solid rgba(255, 170, 0, 0.4)', color: '#ffaa00' };
  return { background: 'rgba(67, 233, 123, 0.2)', border: '1px solid rgba(67, 233, 123, 0.4)', color: '#43e97b' };
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

.card.full-width {
  grid-column: 1 / -1;
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

.process-name-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cpu-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* Ant Design Table 样式覆盖 */
.card-body :deep(.ant-table) {
  background: transparent;
  color: var(--text-primary);
}

.card-body :deep(.ant-table-thead > tr > th) {
  background: var(--glass-bg) !important;
  color: var(--text-primary);
  border-bottom: 1px solid var(--glass-border);
  font-weight: 600;
}

.card-body :deep(.ant-table-thead > tr > th:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

.card-body :deep(.ant-table-tbody > tr) {
  background: transparent !important;
  transition: var(--transition);
}

.card-body :deep(.ant-table-tbody > tr:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

.card-body :deep(.ant-table-tbody > tr:hover > td) {
  background: transparent !important;
}

.card-body :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid var(--glass-border);
  color: var(--text-secondary);
  background: transparent !important;
}

.card-body :deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
  background: rgba(255, 255, 255, 0.05) !important;
}

.card-body :deep(.ant-table-cell-row-hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

.card-body :deep(.ant-pagination) {
  color: var(--text-secondary);
}

.card-body :deep(.ant-pagination-item) {
  background: var(--glass-bg);
  border-color: var(--glass-border);
}

.card-body :deep(.ant-pagination-item a) {
  color: var(--text-primary);
}

.card-body :deep(.ant-pagination-item-active) {
  background: var(--gradient-1);
  border-color: transparent;
}

.card-body :deep(.ant-pagination-item-active a) {
  color: white;
}

.card-body :deep(.ant-select-selector) {
  background: var(--glass-bg) !important;
  border-color: var(--glass-border) !important;
  color: var(--text-primary) !important;
}

.card-body :deep(.ant-select-arrow) {
  color: var(--text-primary);
}

/* 搜索框样式 */
.card-header :deep(.ant-input-search) {
  background: var(--glass-bg);
}

.card-header :deep(.ant-input) {
  background: var(--glass-bg);
  border-color: var(--glass-border);
  color: var(--text-primary);
}

.card-header :deep(.ant-input::placeholder) {
  color: var(--text-muted);
}

.card-header :deep(.ant-input-search-button) {
  background: var(--gradient-1);
  border: none;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
  
  .card-header :deep(.ant-input-search) {
    width: 100% !important;
  }
}
</style>
