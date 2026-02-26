/**
 * Tailwind theme extension: mapea tokens a utilidades (bg-background, text-primary, etc.).
 * Uso en la app: importar tokens.css y en index.css añadir un @theme que use estas variables.
 * Para Tailwind v4 con @import "tailwindcss", la app debe definir en su CSS:
 *
 *   @import "@tools/shared/tokens.css";
 *   @theme {
 *     --color-background: var(--token-background);
 *     --color-surface: var(--token-surface);
 *     --color-border: var(--token-border);
 *     --color-text: var(--token-text);
 *     --color-text-muted: var(--token-text-muted);
 *     --color-primary: var(--token-primary);
 *     --font-sans: var(--font-sans);
 *   }
 *
 * Este archivo exporta el objeto por si la app usa tailwind.config.js (v3) o build con theme extend.
 */
export const themeExtend = {
  colors: {
    background: 'var(--token-background)',
    surface: 'var(--token-surface)',
    border: 'var(--token-border)',
    text: 'var(--token-text)',
    'text-muted': 'var(--token-text-muted)',
    primary: 'var(--token-primary)',
    'primary-hover': 'var(--token-primary-hover)',
    'primary-muted': 'var(--token-primary-muted)',
    'nav-bg': 'var(--token-nav-bg)',
    'nav-border': 'var(--token-nav-border)',
    'nav-text': 'var(--token-nav-text)',
    'nav-text-active': 'var(--token-nav-text-active)',
    spinner: 'var(--token-spinner)',
  },
  fontFamily: {
    sans: 'var(--font-sans)',
  },
}
