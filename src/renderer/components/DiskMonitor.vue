<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="icon">💿</span>
        磁盘状态
      </h2>
    </div>
    <div class="card-body">
      <div class="disk-list" v-if="diskInfo && diskInfo.disks && diskInfo.disks.length > 0">
        <div
          v-for="(disk, index) in diskInfo.disks"
          :key="index"
          class="disk-item fade-in"
        >
          <div class="disk-header">
            <span class="disk-name">{{ disk.name || '未知' }}</span>
            <span class="disk-usage">{{ Math.round(disk.usagePercent || 0) }}%</span>
          </div>
          <div class="disk-progress">
            <div
              class="disk-progress-bar"
              :style="{ width: Math.round(disk.usagePercent || 0) + '%' }"
            ></div>
          </div>
          <div class="disk-info">
            <span>已用: {{ formatBytes(disk.used || 0) }}</span>
            <span>可用: {{ formatBytes(disk.free || 0) }}</span>
            <span>总计: {{ formatBytes(disk.total || 0) }}</span>
          </div>
        </div>
      </div>
      <div class="loading" v-else>
        {{ diskInfo ? '暂无磁盘数据' : '加载中...' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiskData } from '../../types/global';
import { formatBytes } from '../utils/format';

defineProps<{
  diskInfo: DiskData | null;
}>();
</script>

<style scoped>
/* Disk Monitor 特定样式 */
</style>
