<template>
  <div class="sidebar-status">
    <p class="sidebar-status-title">系统状态</p>
    <div class="sidebar-status-chip">
      <span
        v-for="metric in metrics"
        :key="metric.label"
        class="chip-item"
      >
        <strong>{{ metric.label }}：</strong>{{ metric.value }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Metric {
  label: string
  value: string
}

defineProps<{
  metrics: Metric[]
}>()
</script>

<style scoped>
.sidebar-status {
  margin-top: auto;
  padding: 16px 12px 20px;
}

.sidebar-status-title {
  margin: 0 0 10px;
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.sidebar-status-chip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.chip-item {
  font-size: 12px;
  line-height: 1.4;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 999px;
  padding: 6px 10px;
  color: #606266;
}

.chip-item strong {
  font-weight: 600;
  color: #303133;
}

@media (max-width: 768px) {
  .sidebar-status {
    padding: 16px 20px 10px;
  }
}
</style>
