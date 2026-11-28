<template>
  <div class="stats-view">
    <div class="stats-header">
      <h2>{{ t('stats.title') }}</h2>
      <div class="header-actions">
        <span v-if="lastUpdated">{{ t('stats.lastUpdate') }}：{{ lastUpdated }}</span>
        <el-button
          size="small"
          :loading="loading || systemStatusStore.loading"
          @click="loadData()"
        >
          {{ t('stats.refreshData') }}
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">{{ t('stats.totalUploaded') }}</div>
          <div class="summary-value">{{ formatBytes(totalUploaded) }}</div>
          <div class="summary-subtitle">{{ backendLabel }} {{ t('stats.cumulativeValue') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">{{ t('stats.totalDownloaded') }}</div>
          <div class="summary-value">{{ formatBytes(totalDownloaded) }}</div>
          <div class="summary-subtitle">{{ backendLabel }} {{ t('stats.cumulativeValue') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">{{ t('stats.downloadLimit') }}</div>
          <div class="summary-value">{{ downloadLimitText }}</div>
          <div class="summary-subtitle">{{ t('stats.sessionSetting') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="summary-card">
          <div class="summary-title">{{ t('stats.uploadLimit') }}</div>
          <div class="summary-value">{{ uploadLimitText }}</div>
          <div class="summary-subtitle">{{ t('stats.sessionSetting') }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="summary-row secondary">
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">{{ t('stats.sessionOverview') }}</div>
          <div class="summary-value summary-text">
            {{ torrentSummaryText }}
          </div>
          <div class="summary-subtitle">{{ t('stats.fromSessionStats') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">{{ t('stats.diskFreeSpace') }}</div>
          <div class="summary-value">
            {{ freeSpaceText }}
          </div>
          <div class="summary-subtitle">{{ t('stats.basedOnDownloadDir') }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="summary-row secondary">
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">{{ t('stats.currentDownloadSpeed') }}</div>
          <div class="summary-value">
            {{ formatSpeed(sessionStats?.downloadSpeed || 0) }}
          </div>
          <div class="summary-subtitle">{{ t('stats.realTimeRate') }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="summary-card summary-text-card">
          <div class="summary-title">{{ t('stats.currentUploadSpeed') }}</div>
          <div class="summary-value">
            {{ formatSpeed(sessionStats?.uploadSpeed || 0) }}
          </div>
          <div class="summary-subtitle">{{ t('stats.realTimeRate') }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-grid">
      <el-col :xs="24" :lg="24">
        <el-card class="stats-card chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ t('stats.speedTrend') }}</span>
              <small>{{ t('stats.lastRefreshes', { count: speedHistory.length }) }}</small>
            </div>
          </template>
          <VChart class="chart" :option="speedChartOptions" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-grid">
      <el-col :xs="24" :lg="14">
        <el-card class="stats-card chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ t('stats.topTorrents') }}</span>
              <small>{{ t('stats.topTorrentsByDownload', { count: 8 }) }}</small>
            </div>
          </template>
          <VChart class="chart" :option="topTorrentChartOptions" autoresize />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card class="stats-card chart-card">
          <template #header>
            <div class="card-header">
              <span>{{ t('stats.trackerUploadShare') }}</span>
              <small>{{ t('stats.basedOnServer') }}</small>
            </div>
          </template>
          <VChart class="chart" :option="trackerShareChartOptions" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <span>{{ t('stats.trackerStats') }}</span>
          <small>{{ t('stats.trackerStatsSummary') }}</small>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="trackerStats"
        size="small"
        :empty-text="t('stats.noTorrentData')"
      >
        <el-table-column prop="tracker" label="Tracker" min-width="180" />
        <el-table-column :label="t('stats.cumulativeDownload')">
          <template #default="{ row }">
            {{ formatBytes(row.downloaded) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stats.cumulativeUpload')">
          <template #default="{ row }">
            {{ formatBytes(row.uploaded) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stats.shareRatio')">
          <template #default="{ row }">
            {{ (row.ratio || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stats.seedingCount')">
          <template #default="{ row }">
            {{ row.seedingCount }}
          </template>
        </el-table-column>
        <el-table-column :label="t('stats.seedingSize')">
          <template #default="{ row }">
            {{ formatBytes(row.seedingSize) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import { graphic, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import * as api from '@/api/torrents'
import { torrentBackendName } from '@/config/torrentClient'
import type { Torrent } from '@/types/transmission'
import { TorrentStatusEnum, type TorrentTrackerStat } from '@/types/torrent'
import { useSystemStatusStore } from '@/stores/systemStatus'
import { useThemeStore } from '@/stores/theme'
import { getTrackerDisplayName } from '@/utils/torrent'
import { formatBytes, formatSpeed } from '@/utils/format'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, TitleComponent])

const { t } = useI18n()

interface SpeedPoint {
  time: string
  download: number
  upload: number
}

const SPEED_HISTORY_LIMIT = 40
const backendLabel = torrentBackendName

const loading = ref(false)
const torrents = ref<Torrent[]>([])
const systemStatusStore = useSystemStatusStore()
const { sessionStats, sessionConfig, freeSpaceBytes, lastUpdated } =
  storeToRefs(systemStatusStore)
const { currentTheme, currentMode } = storeToRefs(useThemeStore())
const speedHistory = ref<SpeedPoint[]>([])

/**
 * 毛玻璃主题下的图表配色（canvas 无法读取 CSS 变量，这里与 glass.css 的取值保持一致）。
 * 非 glass 主题返回 null，三处 option 不注入任何颜色，保持 ECharts 既有默认行为。
 */
interface GlassChartTheme {
  palette: string[]
  axisLabel: string
  gridLine: string
  splitLine: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

const GLASS_CHART_THEMES: Record<'light' | 'dark', GlassChartTheme> = {
  light: {
    palette: ['#007AFF', '#FF9500', '#34C759', '#5856D6', '#FFCC00', '#AF52DE'],
    axisLabel: '#515154',
    gridLine: 'rgba(60, 60, 67, 0.12)',
    splitLine: 'rgba(60, 60, 67, 0.06)',
    tooltipBg: '#1D1D1F',
    tooltipBorder: 'rgba(255, 255, 255, 0.14)',
    tooltipText: '#F5F5F7',
  },
  dark: {
    palette: ['#0A84FF', '#FF9F0A', '#30D158', '#5E5CE6', '#FFD60A', '#BF5AF2'],
    axisLabel: '#A1A1A6',
    gridLine: 'rgba(235, 235, 245, 0.10)',
    splitLine: 'rgba(235, 235, 245, 0.06)',
    tooltipBg: '#2C2D33',
    tooltipBorder: 'rgba(255, 255, 255, 0.12)',
    tooltipText: '#F5F5F7',
  },
}

const glassChart = computed<GlassChartTheme | null>(() =>
  currentTheme.value === 'glass' ? GLASS_CHART_THEMES[currentMode.value] : null
)

/** #RRGGBB → rgba()，用于面积渐变的透明端 */
const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 面积渐变（glass 下替代纯 opacity 平涂），非 glass 返回 null */
const glassAreaStyle = (color: string, peak: number) => {
  if (!glassChart.value) return null
  return {
    color: new graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: hexToRgba(color, peak) },
      { offset: 1, color: hexToRgba(color, 0) },
    ]),
  }
}

/** glass 下的 tooltip 配置：实色深底，不加 backdrop-filter；非 glass 返回空对象 */
const glassTooltip = (g: GlassChartTheme | null) =>
  g
    ? {
        backgroundColor: g.tooltipBg,
        borderColor: g.tooltipBorder,
        textStyle: { color: g.tooltipText },
        extraCssText:
          'box-shadow:0 12px 40px rgba(16,24,40,.24);border-radius:12px;padding:8px 12px;font-size:12px;',
        confine: true,
        transitionDuration: 0.15,
      }
    : {}

const totalUploaded = computed(
  () => sessionStats.value?.['cumulative-stats'].uploadedBytes || 0
)
const totalDownloaded = computed(
  () => sessionStats.value?.['cumulative-stats'].downloadedBytes || 0
)

const downloadLimitText = computed(() => {
  const config = sessionConfig.value
  if (!config) return t('common.unknown')
  if (!config['speed-limit-down-enabled']) return t('common.disabled')
  return `${config['speed-limit-down']} KB/s`
})

const uploadLimitText = computed(() => {
  const config = sessionConfig.value
  if (!config) return t('common.unknown')
  if (!config['speed-limit-up-enabled']) return t('common.disabled')
  return `${config['speed-limit-up']} KB/s`
})

const torrentSummaryText = computed(() => {
  const stats = sessionStats.value
  if (!stats) return t('stats.noData')
  const parts = [
    `${t('stats.total')} ${stats.torrentCount}`,
    `${t('stats.active')} ${stats.activeTorrentCount}`,
    `${t('stats.paused')} ${stats.pausedTorrentCount}`,
  ]
  return parts.join(' / ')
})

const freeSpaceText = computed(() => {
  if (freeSpaceBytes.value == null) return t('common.unknown')
  return formatBytes(freeSpaceBytes.value)
})

const trackerStats = computed(() => {
  const trackerMap = new Map<
    string,
    { tracker: string; uploaded: number; downloaded: number; seedingCount: number; seedingSize: number }
  >()
  torrents.value.forEach((torrent) => {
    // 优先选择第一个汇报成功的tracker
    let tracker = null
    let trackerStat: TorrentTrackerStat | undefined = undefined
    if (torrent.trackerStats && torrent.trackerStats.length > 0) {
      trackerStat = torrent.trackerStats.find(stat => stat.lastAnnounceSucceeded)
      if (trackerStat) {
        tracker = torrent.trackers?.find(t => t.announce === trackerStat!.announce)
      }
    }
    // 如果没有汇报成功的，则使用第一个tracker
    if (!tracker) {
      tracker = torrent.trackers?.[0]
      trackerStat = torrent.trackerStats?.[0]
    }

    const displayName = tracker ? getTrackerDisplayName(tracker.announce) : '未设置'
    if (!trackerMap.has(displayName)) {
      trackerMap.set(displayName, { tracker: displayName, uploaded: 0, downloaded: 0, seedingCount: 0, seedingSize: 0 })
    }
    const entry = trackerMap.get(displayName)!
    entry.uploaded += torrent.uploadedEver || 0
    entry.downloaded += torrent.downloadedEver || 0
    if (torrent.status === TorrentStatusEnum.SEED && trackerStat) {
      entry.seedingCount++
      entry.seedingSize += torrent.totalSize || 0
    }
  })
  return Array.from(trackerMap.values())
    .map((entry) => ({
      ...entry,
      ratio: entry.downloaded > 0 ? entry.uploaded / entry.downloaded : 0,
    }))
    .sort((a, b) => b.uploaded - a.uploaded)
})

const trackerShareData = computed(() =>
  trackerStats.value
    .slice(0, 10)
    .map((item) => ({ name: item.tracker, value: item.uploaded || 0 }))
)

const topTorrents = computed(() =>
  [...torrents.value]
    .sort((a, b) => (b.downloadedEver || 0) - (a.downloadedEver || 0))
    .slice(0, 8)
    .map((torrent) => ({
      name: torrent.name,
      downloaded: torrent.downloadedEver || 0,
      uploaded: torrent.uploadedEver || 0,
    }))
)

const speedChartOptions = computed(() => {
  const g = glassChart.value
  const downloadColor = g?.palette[0] ?? '#007AFF'
  const uploadColor = g?.palette[1] ?? '#FF9500'
  return {
    // canvas 白底会盖掉玻璃材质，显式透明（ECharts 默认亦为透明，对既有主题无影响）
    backgroundColor: 'transparent',
    ...(g ? { color: g.palette } : {}),
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!Array.isArray(params)) return ''
        const header = `${params[0]?.axisValueLabel || ''}<br/>`
        const lines = params
          .map(
            (item) => `${item.marker}${item.seriesName}：${formatSpeed(item.data ?? 0)}`
          )
          .join('<br/>')
        return header + lines
      },
      ...glassTooltip(g),
    },
    legend: {
      data: [t('stats.downloadSpeed'), t('stats.uploadSpeed')],
      ...(g ? { icon: 'roundRect', textStyle: { color: g.axisLabel } } : {}),
    },
    grid: {
      left: 30,
      right: 10,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: speedHistory.value.map((point) => point.time),
      ...(g
        ? { axisLine: { lineStyle: { color: g.gridLine } }, axisLabel: { color: g.axisLabel } }
        : {}),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatSpeed(value),
        ...(g ? { color: g.axisLabel } : {}),
      },
      ...(g ? { splitLine: { lineStyle: { color: g.splitLine } } } : {}),
    },
    series: [
      {
        name: t('stats.downloadSpeed'),
        type: 'line',
        smooth: true,
        ...(g ? { lineStyle: { width: 2.5 } } : {}),
        areaStyle: glassAreaStyle(downloadColor, 0.25) ?? { opacity: 0.15 },
        data: speedHistory.value.map((point) => point.download),
      },
      {
        name: t('stats.uploadSpeed'),
        type: 'line',
        smooth: true,
        ...(g ? { lineStyle: { width: 2.5 } } : {}),
        areaStyle: glassAreaStyle(uploadColor, 0.18) ?? { opacity: 0.1 },
        data: speedHistory.value.map((point) => point.upload),
      },
    ],
  }
})

const topTorrentChartOptions = computed(() => {
  const g = glassChart.value
  return {
    backgroundColor: 'transparent',
    ...(g ? { color: g.palette } : {}),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || !params.length) return ''
        const name = params[0].name
        const lines = params
          .map((item) => `${item.marker}${item.seriesName}：${formatBytes(item.value || 0)}`)
          .join('<br/>')
        return `${name}<br/>${lines}`
      },
      ...glassTooltip(g),
    },
    legend: {
      data: [t('stats.cumulativeDownload'), t('stats.cumulativeUpload')],
      ...(g ? { icon: 'roundRect', textStyle: { color: g.axisLabel } } : {}),
    },
    grid: {
      left: 0,
      right: 20,
      bottom: 0,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatBytes(value),
        ...(g ? { color: g.axisLabel } : {}),
      },
      ...(g ? { splitLine: { lineStyle: { color: g.splitLine } } } : {}),
    },
    yAxis: {
      type: 'category',
      data: topTorrents.value.map((item) => item.name),
      axisLabel: {
        formatter: (value: string) => (value.length > 16 ? `${value.slice(0, 16)}…` : value),
        ...(g ? { color: g.axisLabel } : {}),
      },
      ...(g ? { axisLine: { lineStyle: { color: g.gridLine } } } : {}),
    },
    series: [
      {
        name: t('stats.cumulativeDownload'),
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series',
        },
        ...(g ? { itemStyle: { borderRadius: [4, 4, 0, 0] } } : {}),
        data: topTorrents.value.map((item) => item.downloaded),
      },
      {
        name: t('stats.cumulativeUpload'),
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series',
        },
        ...(g ? { itemStyle: { borderRadius: [4, 4, 0, 0] } } : {}),
        data: topTorrents.value.map((item) => item.uploaded),
      },
    ],
  }
})

const trackerShareChartOptions = computed(() => {
  const g = glassChart.value
  return {
    backgroundColor: 'transparent',
    ...(g ? { color: g.palette } : {}),
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }: any) =>
        `${name}<br/>${t('stats.cumulativeUpload')}：${formatBytes(value || 0)}<br/>占比：${percent}%`,
      ...glassTooltip(g),
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: t('stats.trackerUploadShare'),
        type: 'pie',
        radius: ['40%', '70%'],
        data: trackerShareData.value,
        // glass：扇区之间不描白边
        ...(g ? { itemStyle: { borderColor: 'transparent', borderWidth: 2 } } : {}),
        label: {
          formatter: '{d}%',
          ...(g ? { color: g.axisLabel } : {}),
        },
        labelLine: {
          show: true,
          ...(g ? { lineStyle: { color: g.gridLine } } : {}),
        },
      },
    ],
  }
})

watch(
  () => sessionStats.value,
  (stats) => {
    if (!stats) return
    const nextPoint: SpeedPoint = {
      time: dayjs().format('HH:mm:ss'),
      download: stats.downloadSpeed || 0,
      upload: stats.uploadSpeed || 0,
    }
    const updated = speedHistory.value.slice()
    updated.push(nextPoint)
    if (updated.length > SPEED_HISTORY_LIMIT) {
      updated.shift()
    }
    speedHistory.value = updated
  },
  { immediate: true }
)

const loadTorrents = async () => {
  const torrentData = await api.getTorrents()
  torrents.value = torrentData.torrents
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([systemStatusStore.load(), loadTorrents()])
  } catch (error: any) {
    ElMessage.error(`${t('stats.loadFailed')}: ${error.message || error}`)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await loadData()
  } catch (error: any) {
    ElMessage.error(`${t('stats.loadDataFailed')}: ${error.message || error}`)
  }
})
</script>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--bc-text-subtle);
  flex-wrap: wrap;
}

.header-actions span {
  white-space: nowrap;
}

.summary-row {
  margin-top: 8px;
}

.summary-card {
  height: 100%;
  min-height: 95px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-card :deep(.el-card__body) {
  padding: 14px;
}

.summary-text-card {
  justify-content: flex-start;
}

.summary-title {
  font-size: 12px;
  color: var(--bc-text-subtle);
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.summary-text {
  font-size: 14px;
  font-weight: 500;
  word-break: break-all;
}

.summary-subtitle {
  margin-top: 4px;
  font-size: 11px;
  color: var(--bc-text-subtle);
  font-variant-numeric: tabular-nums;
}

.stats-card {
  margin-top: 16px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 600;
}

.card-header small {
  font-weight: normal;
  color: var(--bc-text-subtle);
}

.charts-grid {
  margin-top: 8px;
}

.chart-card {
  min-height: 320px;
}

.chart {
  width: 100%;
  height: 280px;
}

@media (max-width: 768px) {
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions span {
    white-space: normal;
  }

  .header-actions :deep(.el-button) {
    width: 100%;
  }

  .summary-card {
    min-height: 85px;
  }

  .summary-card :deep(.el-card__body) {
    padding: 12px;
  }

  .chart-card {
    min-height: 280px;
  }

  .chart {
    height: 240px;
  }

  .stats-view :deep(.el-row) {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .stats-view :deep(.el-row) > .el-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}
</style>
