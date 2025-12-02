<template>
  <header class="header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="app-title">
          <span class="icon">📊</span>
          EPM Better
        </h1>
        <a-tag v-if="systemInfo" color="blue" class="system-info-tag">
          <template #icon>
            <desktop-outlined />
          </template>
          {{ systemInfo.hostname }} | {{ systemInfo.platform }} {{ systemInfo.arch }}
        </a-tag>
        <a-tag v-else color="default" class="system-info-tag">
          <template #icon>
            <loading-outlined :spin="true" />
          </template>
          加载中...
        </a-tag>
      </div>
      <div class="header-right">
        <a-space :size="12">
          <a-button 
            v-if="!isMonitoring" 
            type="primary" 
            size="large"
            @click="$emit('start-monitoring')"
          >
            <template #icon>
              <play-circle-outlined />
            </template>
            开始监控
          </a-button>
          <a-button 
            v-if="isMonitoring" 
            type="default"
            size="large"
            @click="$emit('stop-monitoring')"
          >
            <template #icon>
              <pause-circle-outlined />
            </template>
            停止监控
          </a-button>
          <a-button 
            v-if="isMonitoring" 
            type="primary"
            size="large"
            :loading="isAnalyzing"
            style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border: none;"
            @click="$emit('ai-analyze')"
          >
            <template #icon>
              <robot-outlined />
            </template>
            {{ isAnalyzing ? '分析中...' : 'AI分析' }}
          </a-button>
        </a-space>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { DesktopOutlined, LoadingOutlined, PlayCircleOutlined, PauseCircleOutlined, RobotOutlined } from '@ant-design/icons-vue';
import type { SystemInfo } from '../../types/global';

defineProps<{
  systemInfo: SystemInfo | null;
  isMonitoring: boolean;
  isAnalyzing: boolean;
}>();

defineEmits<{
  (e: 'start-monitoring'): void;
  (e: 'stop-monitoring'): void;
  (e: 'ai-analyze'): void;
}>();
</script>

<style scoped>
.header {
  position: relative;
  z-index: 10;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  padding: var(--spacing-lg) var(--spacing-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
}

.app-title .icon {
  background: none !important;
  -webkit-background-clip: initial !important;
  background-clip: initial !important;
  -webkit-text-fill-color: initial !important;
  color: var(--text-primary);
}

.system-info-tag {
  font-size: 14px;
  padding: 6px 12px;
  background: var(--glass-bg) !important;
  border: 1px solid var(--glass-border) !important;
  backdrop-filter: blur(10px);
}

.header-right {
  display: flex;
  gap: var(--spacing-md);
}

/* Ant Design 按钮样式覆盖 */
.header-right :deep(.ant-btn-primary) {
  background: var(--gradient-1);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-right :deep(.ant-btn-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.header-right :deep(.ant-btn-default) {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  backdrop-filter: blur(10px);
}

.header-right :deep(.ant-btn-default:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .header-left {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
