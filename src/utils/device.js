import { ref } from 'vue'

export const phoneDeviceRevision = ref(0)

let listenersInstalled = false

export function isPhoneDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const ua = navigator.userAgent || ''
  const uaDataMobile = navigator.userAgentData?.mobile === true
  const phoneUa = /Mobi|Android.*Mobile|iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const tabletUa = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)

  if ((phoneUa || uaDataMobile) && !tabletUa) return true

  const visualWidth = window.visualViewport?.width || window.innerWidth
  const visualHeight = window.visualViewport?.height || window.innerHeight
  const viewportWidth = Math.min(visualWidth, visualHeight)
  const viewportHeight = Math.max(visualWidth, visualHeight)
  const screenWidth = Math.min(window.screen?.width || viewportWidth, window.screen?.height || viewportHeight)
  const screenHeight = Math.max(window.screen?.width || viewportWidth, window.screen?.height || viewportHeight)

  if (!tabletUa && viewportWidth <= 600) return true

  const hasTouch = Number(navigator.maxTouchPoints || 0) > 0
  const coarsePointer = typeof window.matchMedia === 'function'
    && (
      window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(any-pointer: coarse)').matches
    )
  const phoneViewport = viewportWidth <= 600 && viewportHeight <= 960
  const phoneScreen = screenWidth <= 600 && screenHeight <= 960

  return hasTouch && coarsePointer && !tabletUa && (phoneViewport || phoneScreen)
}

export function refreshPhoneDevice() {
  phoneDeviceRevision.value += 1
}

export function installPhoneDeviceListeners() {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true

  const refresh = () => refreshPhoneDevice()
  window.addEventListener('resize', refresh, { passive: true })
  window.addEventListener('orientationchange', refresh, { passive: true })
  window.visualViewport?.addEventListener?.('resize', refresh, { passive: true })

  if (typeof window.matchMedia === 'function') {
    const mediaQueries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(any-pointer: coarse)'),
    ]
    mediaQueries.forEach((query) => {
      try {
        query.addEventListener('change', refresh)
      } catch (_) {
        try { query.addListener(refresh) } catch (_) {}
      }
    })
  }

  refresh()
}
