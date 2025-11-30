<template>
  <div class="sidebar-status">
    <div class="status-header">系统状态</div>
    <div class="status-list">
      <div v-for="metric in metrics" :key="metric.label" class="status-item">
        <span class="status-label">{{ metric.label }}</span>
        <span class="status-value">{{ metric.value }}</span>
      </div>
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
  padding: 12px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

.status-header {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  padding-left: 4px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.status-label {
  color: #606266;
}

.status-value {
  color: #303133;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}

@media (max-width: 768px) {
  .sidebar-status {
    padding: 12px 16px;
  }
}
</style>
