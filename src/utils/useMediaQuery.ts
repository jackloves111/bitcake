import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Lightweight composable to reactively listen to a media query.
 */
export const useMediaQuery = (query: string) => {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | null = null
  let listener: ((event: MediaQueryListEvent) => void) | null = null

  const cleanup = () => {
    if (!mediaQuery) return
    if (listener) {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', listener)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(listener)
      }
    }
    mediaQuery = null
    listener = null
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    mediaQuery = window.matchMedia(query)
    matches.value = mediaQuery.matches
    listener = (event: MediaQueryListEvent) => {
      matches.value = event.matches
    }
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener)
    }
  })

  onBeforeUnmount(() => {
    cleanup()
  })

  return matches
}
