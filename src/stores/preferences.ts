import { defineStore } from 'pinia'
import { ref } from 'vue'

export const REFRESH_INTERVAL_STORAGE_KEY = 'bitcake_refresh_interval'

/** 默认刷新间隔 5 秒 */
export const DEFAULT_REFRESH_INTERVAL = 5000

export interface RefreshIntervalOption {
  labelKey: string
  value: number // 单位毫秒，0 表示仅手动
}

export const REFRESH_INTERVAL_OPTIONS: RefreshIntervalOption[] = [
  { labelKey: 'settings.preferences.interval2s', value: 2000 },
  { labelKey: 'settings.preferences.interval3s', value: 3000 },
  { labelKey: 'settings.preferences.interval5s', value: 5000 },
  { labelKey: 'settings.preferences.interval10s', value: 10000 },
  { labelKey: 'settings.preferences.interval15s', value: 15000 },
  { labelKey: 'settings.preferences.interval30s', value: 30000 },
  { labelKey: 'settings.preferences.interval60s', value: 60000 },
  { labelKey: 'settings.preferences.intervalManual', value: 0 },
]

export const usePreferencesStore = defineStore('preferences', () => {
  const getStoredInterval = (): number => {
    try {
      const stored = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY)
      if (stored !== null) {
        const parsed = parseInt(stored, 10)
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed
        }
      }
    } catch {
      // localStorage 不可用时退回默认值
    }
    return DEFAULT_REFRESH_INTERVAL
  }

  const refreshInterval = ref<number>(getStoredInterval())

  const setRefreshInterval = (interval: number) => {
    refreshInterval.value = interval
    try {
      localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(interval))
    } catch {
      // ignore
    }
  }

  return {
    refreshInterval,
    setRefreshInterval,
  }
})
