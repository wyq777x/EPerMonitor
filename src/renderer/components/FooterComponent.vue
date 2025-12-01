<template>
  <footer class="footer">
    <div class="footer-content">
      <span class="footer-item">
        <span class="icon">⏱️</span>
        运行时间: <span>{{ formattedUptime }}</span>
      </span>
      <span class="footer-item">
        <span class="icon">🔄</span>
        更新间隔: <span>1000ms</span>
      </span>
      <span class="footer-item">
        <span class="icon">📡</span>
        状态: <span>{{ status }}</span>
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
/* Footer 特定样式 */
</style>
