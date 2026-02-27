import { useInstallPrompt } from '../hooks/useInstallPrompt.js'

/**
 * Optional banner or button to prompt "Add to home screen" when the PWA is installable
 * and not already running as standalone. Use in layout or settings.
 * @param {Object} props
 * @param {string} [props.appName] - App name for the CTA (e.g. "My Planner")
 * @param {string} [props.className] - Extra class for the container
 * @param {'banner'|'button'} [props.variant] - 'banner' = full-width bar, 'button' = single button
 */
export function InstallBanner({ appName = 'this app', className = '', variant = 'banner' }) {
  const { canInstall, install } = useInstallPrompt()
  if (!canInstall) return null

  const handleInstall = () => {
    install()
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleInstall}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors touch-manipulation ${className}`}
      >
        Add to home screen
      </button>
    )
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-surface border border-border text-text ${className}`}
      role="region"
      aria-label="Install app"
    >
      <span className="text-sm font-medium">
        Install {appName} to use it as an app
      </span>
      <button
        type="button"
        onClick={handleInstall}
        className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors touch-manipulation"
      >
        Install
      </button>
    </div>
  )
}
