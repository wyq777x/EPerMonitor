<template>
  <div class="card glass-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="icon">🌐</span>
        网络流量
      </h2>
    </div>
    <div class="card-body">
      <div class="network-list" v-if="networkInfo && networkInfo.interfaces && networkInfo.interfaces.length > 0">
        <div
          v-for="(iface, index) in networkInfo.interfaces"
          :key="index"
          class="network-item fade-in"
        >
          <div class="network-header">
            <span class="network-name">{{ iface.name || '未知' }}</span>
            <span class="network-ip">{{ iface.ip || '-' }}</span>
          </div>
          <div class="network-info">
            <div class="network-stat">
              <span class="label">↓ 下载:</span>
              <span class="value">{{ formatSpeed(iface.rxSpeed || 0) }}</span>
            </div>
            <div class="network-stat">
              <span class="label">↑ 上传:</span>
              <span class="value">{{ formatSpeed(iface.txSpeed || 0) }}</span>
            </div>
            <div class="network-stat">
              <span class="label">MAC:</span>
              <span class="value">{{ iface.mac || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="loading" v-else>
        {{ networkInfo ? '暂无网络数据' : '加载中...' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NetworkData } from '../../types/global';
import { formatSpeed } from '../utils/format';

defineProps<{
  networkInfo: NetworkData | null;
}>();
</script>

<style scoped>
/* Network Monitor 特定样式 */
</style>
