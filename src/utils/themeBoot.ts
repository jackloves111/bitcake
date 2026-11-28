// 主题共享逻辑：存储 key、解析规则与写 DOM 的唯一实现。
// stores/theme.ts（运行时切换）与 applyStoredTheme()（首屏防闪烁）都从这里取值，
// 避免「存储 key / 兼容规则」在两处各自维护后漂移。

export type ThemeAccent = 'green' | 'blue' | 'pink' | 'glass'
export type ThemeModeType = 'light' | 'dark'

/**
 * 毛玻璃降级等级（仅 glass 主题使用，写在 <html data-bc-glass>）：
 * - full：按视觉稿取值
 * - lite：模糊半径减半、去饱和（低内存 / 少核设备）
 * - solid：全部实色回退（系统减弱透明度 / 浏览器不支持 backdrop-filter / 用户手动关闭）
 */
export type GlassTier = 'full' | 'lite' | 'solid'

export const ACCENT_STORAGE_KEY = 'app-theme'
export const MODE_STORAGE_KEY = 'app-theme-mode'
/** 用户手动「减弱透明效果」的持久化 key，存 'solid' 表示强制实色 */
export const GLASS_OVERRIDE_STORAGE_KEY = 'app-theme-glass'

export const THEME_ACCENTS: ThemeAccent[] = ['green', 'blue', 'pink', 'glass']

/** 非 glass 主题的 <meta name="theme-color"> 固定值，与 index.html 中的静态值保持一致 */
const DEFAULT_THEME_COLOR = '#2f9e63'

export const prefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

/** 兼容旧版本主题名（'fresh' / 'default'），非法值统一回退 green */
export const normalizeAccent = (saved: string | null): ThemeAccent => {
  if (saved === 'fresh' || saved === 'default') return 'green'
  return THEME_ACCENTS.includes(saved as ThemeAccent) ? (saved as ThemeAccent) : 'green'
}

/** 解析深浅模式：优先取存储值，否则跟随系统偏好 */
export const resolveStoredMode = (): ThemeModeType => {
  try {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
    if (savedMode === 'light' || savedMode === 'dark') return savedMode
  } catch {
    /* localStorage 不可用时保持系统偏好 */
  }
  return prefersDark() ? 'dark' : 'light'
}

/** 系统是否要求减弱透明度（目前仅 Safari 支持，读取失败按 false） */
export const prefersReducedTransparency = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    )
  } catch {
    return false
  }
}

/** 浏览器是否支持 backdrop-filter（不支持则 glass 走实色） */
export const supportsBackdropFilter = (): boolean => {
  try {
    if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return true
    return (
      CSS.supports('backdrop-filter', 'blur(1px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
    )
  } catch {
    return true
  }
}

/**
 * 自动判定 glass 降级等级：
 * 系统减弱透明度 / 不支持 backdrop-filter → solid；
 * deviceMemory ≤ 4 或 hardwareConcurrency ≤ 4 → lite；读取失败按 full。
 */
export const detectGlassTier = (): GlassTier => {
  if (typeof window === 'undefined') return 'full'
  if (prefersReducedTransparency() || !supportsBackdropFilter()) return 'solid'

  try {
    const nav = navigator as Navigator & { deviceMemory?: number }
    const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined
    const cores =
      typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : undefined
    if ((memory !== undefined && memory <= 4) || (cores !== undefined && cores <= 4)) {
      return 'lite'
    }
  } catch {
    /* 读取失败按 full */
  }
  return 'full'
}

/** 读取用户手动覆盖值（仅 'solid' 有效），没有则返回 null */
export const readGlassOverride = (): GlassTier | null => {
  try {
    const saved = localStorage.getItem(GLASS_OVERRIDE_STORAGE_KEY)
    return saved === 'solid' ? 'solid' : null
  } catch {
    return null
  }
}

/** 解析最终生效的 glass 等级：手动 solid 覆盖 > 系统自动判定 */
export const resolveGlassTier = (): GlassTier => readGlassOverride() ?? detectGlassTier()

/** 更新移动端浏览器 chrome 颜色（index.html 已有该 meta） */
const applyThemeColorMeta = (accent: ThemeAccent, mode: ThemeModeType): void => {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  meta.setAttribute(
    'content',
    accent === 'glass' ? (mode === 'dark' ? '#0D0F14' : '#F4F6FB') : DEFAULT_THEME_COLOR,
  )
}

/** 把主题写入 <html>，Element Plus 与自定义样式都从这里取值 */
export const applyThemeToRoot = (
  accent: ThemeAccent,
  mode: ThemeModeType,
  glassTier?: GlassTier,
): void => {
  const root = document.documentElement
  root.setAttribute('data-bc-theme', accent)
  root.setAttribute('data-bc-mode', mode)
  // 非 glass 主题不保留 data-bc-glass，保证三套既有主题的 DOM 状态与之前一致
  if (accent === 'glass') {
    root.setAttribute('data-bc-glass', glassTier ?? resolveGlassTier())
  } else {
    root.removeAttribute('data-bc-glass')
  }
  root.classList.toggle('dark', mode === 'dark')
  applyThemeColorMeta(accent, mode)
}

/**
 * 在 Vue 挂载前把主题写到 <html>，避免首屏主题闪烁。
 * 在 main.ts 中于 createApp 之前调用。
 */
export function applyStoredTheme(): void {
  if (typeof document === 'undefined') return

  let saved: string | null = null
  try {
    saved = localStorage.getItem(ACCENT_STORAGE_KEY)
  } catch {
    saved = null
  }

  const accent = normalizeAccent(saved)
  applyThemeToRoot(accent, resolveStoredMode(), accent === 'glass' ? resolveGlassTier() : undefined)
}
