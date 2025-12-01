<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <global-outlined style="font-size: 20px;" />
        网络流量
      </h2>
    </div>
    <div class="card-body">
      <a-list
        v-if="networkInfo && networkInfo.interfaces && networkInfo.interfaces.length > 0"
        :data-source="networkInfo.interfaces"
        :loading="false"
      >
        <template #renderItem="{ item }">
          <a-list-item class="network-item">
            <a-list-item-meta>
              <template #title>
                <a-space>
                  <a-tag color="blue">{{ item.name || '未知' }}</a-tag>
                  <a-tag v-if="item.ip" color="cyan">
                    <template #icon>
                      <wifi-outlined />
                    </template>
                    {{ item.ip }}
                  </a-tag>
                </a-space>
              </template>
              <template #description>
                <a-descriptions :column="1" size="small">
                  <a-descriptions-item>
                    <template #label>
                      <arrow-down-outlined /> 下载速度
                    </template>
                    <a-tag color="green">{{ formatSpeed(item.rxSpeed || 0) }}</a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item>
                    <template #label>
                      <arrow-up-outlined /> 上传速度
                    </template>
                    <a-tag color="orange">{{ formatSpeed(item.txSpeed || 0) }}</a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item v-if="item.mac">
                    <template #label>
                      <laptop-outlined /> MAC地址
                    </template>
                    <span style="font-family: monospace; font-size: 12px;">{{ item.mac }}</span>
                  </a-descriptions-item>
                </a-descriptions>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
      <a-empty v-else description="暂无网络数据" :image="simpleImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { GlobalOutlined, WifiOutlined, ArrowDownOutlined, ArrowUpOutlined, LaptopOutlined } from '@ant-design/icons-vue';
import { Empty } from 'ant-design-vue';
import type { NetworkData } from '../../types/global';
import { formatSpeed } from '../utils/format';

defineProps<{
  networkInfo: NetworkData | null;
}>();

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
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

.card-body :deep(.ant-descriptions-item-label) {
  color: var(--text-muted);
}

.card-body :deep(.ant-descriptions-item-content) {
  color: var(--text-primary);
}

.card-body :deep(.ant-empty) {
  color: var(--text-muted);
}

.card-body :deep(.ant-empty-description) {
  color: var(--text-muted);
}

/* Tag 样式美化 */
.card-body :deep(.ant-tag) {
  background: var(--glass-bg);
  border-color: var(--glass-border);
  backdrop-filter: blur(10px);
}
</style>
