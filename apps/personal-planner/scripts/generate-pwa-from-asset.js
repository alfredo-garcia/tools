#!/usr/bin/env node
/**
 * Generates PWA assets from a source image. Always uses the FULL image
 * (no cropping): icon = image resized to 512×512; splash = image scaled
 * to fit and centered on orange background. Favicon = same icon at 32×32.
 *
 * Usage: node scripts/generate-pwa-from-asset.js [path-to-image.png]
 */
import { Jimp, rgbaToInt } from 'jimp'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')

const defaultInput = join(root, 'assets', 'image.png')
const inputPath = process.argv[2] || defaultInput

const SPLASH_W = 1284
const SPLASH_H = 2778

/** Sample background color from image corners (icon background = splash background) */
function sampleBackgroundColor(img) {
  const w = img.bitmap.width
  const h = img.bitmap.height
  const data = img.bitmap.data
  const samples = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3]
  ]
  let r = 0, g = 0, b = 0, n = 0
  for (const [px, py] of samples) {
    if (px >= 0 && px < w && py >= 0 && py < h) {
      const idx = (py * w + px) << 2
      r += data[idx]
      g += data[idx + 1]
      b += data[idx + 2]
      n++
    }
  }
  if (n === 0) return rgbaToInt(249, 115, 22, 255)
  r = Math.round(r / n)
  g = Math.round(g / n)
  b = Math.round(b / n)
  return rgbaToInt(r, g, b, 255)
}

async function main() {
  const full = await Jimp.read(inputPath)
  const w = full.bitmap.width
  const h = full.bitmap.height

  mkdirSync(publicDir, { recursive: true })

  // Icon: full image → 512×512
  const icon512 = full.clone().resize({ w: 512, h: 512 })
  writeFileSync(join(publicDir, 'pwa-512x512.png'), await icon512.getBuffer('image/png'))
  console.log('Wrote pwa-512x512.png')

  const icon192 = icon512.clone().resize({ w: 192, h: 192 })
  const icon180 = icon512.clone().resize({ w: 180, h: 180 })
  const icon32 = icon512.clone().resize({ w: 32, h: 32 })
  writeFileSync(join(publicDir, 'pwa-192x192.png'), await icon192.getBuffer('image/png'))
  writeFileSync(join(publicDir, 'apple-touch-icon.png'), await icon180.getBuffer('image/png'))
  writeFileSync(join(publicDir, 'favicon.png'), await icon32.getBuffer('image/png'))
  console.log('Wrote pwa-192x192.png, apple-touch-icon.png, favicon.png')

  // Splash: full image scaled to fit, centered on same background as icon
  const bgColor = sampleBackgroundColor(full)
  const scale = Math.min(SPLASH_W / w, SPLASH_H / h)
  const scaledW = Math.round(w * scale)
  const scaledH = Math.round(h * scale)
  const x = Math.round((SPLASH_W - scaledW) / 2)
  const y = Math.round((SPLASH_H - scaledH) / 2)
  const bg = new Jimp({ width: SPLASH_W, height: SPLASH_H, color: bgColor })
  const scaled = full.clone().resize({ w: scaledW, h: scaledH })
  bg.blit({ src: scaled, x, y })
  writeFileSync(join(publicDir, 'splash.png'), await bg.getBuffer('image/png'))
  console.log('Wrote splash.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
