<template>
  <section class="sidebar-status" role="group" :aria-labelledby="titleId">
    <div class="status-header">
      <h2 :id="titleId" class="status-header__title">{{ t('sidebar.systemStatus') }}</h2>
      <span class="status-header__version" :title="versionTitle">{{ version }}</span>
    </div>
    <div class="status-well">
      <div
        v-for="m in metrics"
        :key="m.key"
        class="status-item"
        :class="`is-${m.key}`"
        role="group"
        :aria-label="m.title"
        :title="m.title"
      >
        <el-icon v-if="m.key === 'download'" class="status-arrow is-down" aria-hidden="true">
          <ArrowDown />
        </el-icon>
        <el-icon v-else-if="m.key === 'upload'" class="status-arrow is-up" aria-hidden="true">
          <ArrowUp />
        </el-icon>
        <span
          v-else-if="!(m.key === 'lastUpdate' && m.hideLabel)"
          class="status-label"
          aria-hidden="true"
        >{{ m.label }}</span>
        <span class="status-value-group" aria-hidden="true">
          <span class="status-value">{{ m.value }}</span>
          <span v-if="m.cap" class="status-cap">/ {{ m.cap }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
export type StatusMetricKey = 'download' | 'upload' | 'freeSpace' | 'lastUpdate'

export interface StatusMetric {
  key: StatusMetricKey
  label: string
  value: string
  cap?: string
  title: string
  hideLabel?: boolean
}
</script>

<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'

defineProps<{
  metrics: StatusMetric[]
  version: string
  versionTitle: string
}>()

const { t } = useI18n()
// 桌面侧栏与抽屉各渲染一份，固定 id 会重复，改用 useId 生成唯一 id
const titleId = useId()
</script>

<style scoped>
.sidebar-status {
  flex: 0 0 auto;
  margin-top: auto;
  padding: 8px 10px 10px;
  border-top: 1px solid var(--bc-border);
  line-height: 18px;
  /* 不设背景：侧栏本身已是 --bc-surface，glass 下避免双层半透明叠加发亮 */
}

.status-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0 8px 4px;
  line-height: 18px;
}

.status-header__title {
  flex: 0 0 auto;
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: var(--bc-text-subtle-bar, var(--bc-text-muted));
}

.status-header__version {
  min-width: 0;
  max-width: 50%;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--bc-text-subtle-bar, var(--bc-text-muted));
}

/* 三行井：速度两行各占满整行，第三行由「空间」（左）与「更新」（右）并排 */
.status-well {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  gap: 4px;
  padding: 6px 10px;
  background: var(--bc-surface-muted);
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-sm);
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

.status-item.is-download,
.status-item.is-upload {
  grid-column: 1 / -1;
}

.status-item.is-freeSpace {
  justify-self: start;
}

.status-item.is-lastUpdate {
  justify-self: end;
}

.status-arrow {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--bc-text-muted);
}

.status-label {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--bc-text-muted);
}

.status-value-group {
  display: inline-flex;
  align-items: baseline;
  flex: 0 1 auto;
  gap: 4px;
  min-width: 0;
  line-height: 18px;
}

/* 主值永不截断；限速后缀只作省略保险 */
.status-value {
  flex: 0 0 auto;
  max-width: 100%;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--bc-text);
}

.status-cap {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--bc-text-muted);
}

/* 第三行没有限速后缀，值整体不收缩，空间不足时只截标签 */
.status-item.is-freeSpace .status-value-group,
.status-item.is-lastUpdate .status-value-group {
  flex: 0 0 auto;
}

/* 移动端：面板位于抽屉 .drawer-scroll（内距 10px）内，去掉横向 padding 让井与 nav-item 对齐 */
@media (max-width: 768px) {
  .sidebar-status {
    margin-top: 12px;
    padding: 8px 0 6px;
  }
}
</style>
