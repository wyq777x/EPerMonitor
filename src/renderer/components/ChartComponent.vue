<template>
  <div class="card glass-card full-width">
    <div class="card-header">
      <h2 class="card-title">
        <span class="icon">📈</span>
        实时监控图表
      </h2>
    </div>
    <div class="card-body">
      <div class="chart-container">
        <canvas ref="canvasRef" width="800" height="300"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useChart } from '../composables/useChart';

const props = defineProps<{
  cpuUsage: number;
  memoryUsage: number;
}>();

const { canvasRef, addData } = useChart();

// 监听数据变化并添加到图表
watch(
  () => [props.cpuUsage, props.memoryUsage],
  ([cpu, memory]) => {
    if (cpu > 0 || memory > 0) {
      addData(cpu, memory);
    }
  }
);
</script>

<style scoped>
/* Chart 特定样式 */
</style>
