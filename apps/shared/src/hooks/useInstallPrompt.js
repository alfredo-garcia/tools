import { useState, useEffect } from 'react'

/**
 * Hook for PWA install prompt.
 * @returns {{ canInstall: boolean, isStandalone: boolean, install: () => Promise<'accepted'|'dismissed'|null> }}
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      setIsStandalone(standalone)
    }
    checkStandalone()
    const mql = window.matchMedia('(display-mode: standalone)')
    const listener = () => checkStandalone()
    mql.addEventListener('change', listener)

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    return () => {
      mql.removeEventListener('change', listener)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return null
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome
  }

  return {
    canInstall: Boolean(deferredPrompt) && !isStandalone,
    isStandalone,
    install
  }
}
