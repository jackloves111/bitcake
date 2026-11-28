import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref } from 'vue'
import {
  ACCENT_STORAGE_KEY,
  GLASS_OVERRIDE_STORAGE_KEY,
  MODE_STORAGE_KEY,
  applyThemeToRoot,
  detectGlassTier,
  normalizeAccent,
  prefersDark,
  readGlassOverride,
  resolveGlassTier,
  resolveStoredMode,
  type GlassTier,
  type ThemeAccent,
  type ThemeModeType,
} from '@/utils/themeBoot'

// 对外保持原有类型名，MainLayout 等处无需改动
export type ThemeType = ThemeAccent
export type ThemeMode = ThemeModeType

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeType>('green')
  const currentMode = ref<ThemeMode>(prefersDark() ? 'dark' : 'light')
  /** glass 主题当前生效的降级等级（手动 solid 覆盖 > 系统自动判定） */
  const glassTier = ref<GlassTier>(resolveGlassTier())

  /** 主题下拉「减弱透明效果」开关的状态：系统或手动任一为 solid 即视为开启 */
  const reduceTransparency = computed(() => glassTier.value === 'solid')

  /** 把主题写入 <html>，Element Plus 与自定义样式都从这里取值 */
  const applyTheme = () => {
    applyThemeToRoot(currentTheme.value, currentMode.value, glassTier.value)
  }

  const loadTheme = () => {
    let savedAccent: string | null = null
    try {
      savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY)
    } catch {
      savedAccent = null
    }

    currentTheme.value = normalizeAccent(savedAccent)
    currentMode.value = resolveStoredMode()
    glassTier.value = resolveGlassTier()
    applyTheme()
  }

  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, theme)
    } catch {
      /* localStorage 不可用时仅更新内存状态 */
    }
    applyTheme()
  }

  const setMode = (mode: ThemeMode) => {
    currentMode.value = mode
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch {
      /* localStorage 不可用时仅更新内存状态 */
    }
    applyTheme()
  }

  const toggleMode = () => {
    setMode(currentMode.value === 'dark' ? 'light' : 'dark')
  }

  /**
   * 手动「减弱透明效果」：开启 = 写入 solid 覆盖并持久化；
   * 关闭 = 清除覆盖，回落到系统自动判定（系统本身要求减弱时仍会保持 solid）。
   */
  const setReduceTransparency = (enabled: boolean) => {
    try {
      if (enabled) {
        localStorage.setItem(GLASS_OVERRIDE_STORAGE_KEY, 'solid')
      } else {
        localStorage.removeItem(GLASS_OVERRIDE_STORAGE_KEY)
      }
    } catch {
      /* localStorage 不可用时仅更新内存状态 */
    }
    glassTier.value = enabled ? 'solid' : detectGlassTier()
    applyTheme()
  }

  // 跟随系统「减弱透明度」设置的变化（目前仅 Safari 支持该媒体查询）
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mql = window.matchMedia('(prefers-reduced-transparency: reduce)')
    const onTransparencyChange = () => {
      if (readGlassOverride() === 'solid') return
      const next = detectGlassTier()
      if (next !== glassTier.value) {
        glassTier.value = next
        applyTheme()
      }
    }
    mql.addEventListener('change', onTransparencyChange)
    onScopeDispose(() => mql.removeEventListener('change', onTransparencyChange))
  }

  // 首次进入时立即应用，避免出现主题闪烁
  loadTheme()

  return {
    currentTheme,
    currentMode,
    glassTier,
    reduceTransparency,
    loadTheme,
    setTheme,
    setMode,
    toggleMode,
    setReduceTransparency,
  }
})
