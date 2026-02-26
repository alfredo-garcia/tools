#!/usr/bin/env node
/**
 * Generates placeholder PWA assets (icons + splash) into public/.
 * Usage: node scripts/generate-pwa-assets.js [hexColor] [outputDir]
 * Default: #0f172a, public/
 * Example for planner: node scripts/generate-pwa-assets.js #0a0a0a ../personal-planner/public
 */
import { Jimp, rgbaToInt } from 'jimp'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const defaultColor = '#0f172a'
const hexColor = process.argv[2] || defaultColor
const outDir = process.argv[3] ? join(root, process.argv[3]) : join(root, 'public')

function hexToJimpColor(hex) {
  const s = hex.replace(/^#/, '')
  const r = parseInt(s.slice(0, 2), 16)
  const g = parseInt(s.slice(2, 4), 16)
  const b = parseInt(s.slice(4, 6), 16)
  return rgbaToInt(r, g, b, 255)
}

async function createPng(width, height, color) {
  const image = new Jimp({ width, height, color })
  return image.getBuffer('image/png')
}

async function createSplash(splashW, splashH, color, iconSize = 512) {
  const icon = new Jimp({ width: iconSize, height: iconSize, color })
  const splash = new Jimp({ width: splashW, height: splashH, color })
  const x = Math.floor((splashW - iconSize) / 2)
  const y = Math.floor((splashH - iconSize) / 2)
  splash.blit(icon, x, y)
  return splash.getBuffer('image/png')
}

async function main() {
  mkdirSync(outDir, { recursive: true })
  const color = hexToJimpColor(hexColor.startsWith('#') ? hexColor : '#' + hexColor)

  const sizes = [
    [32, 32, 'favicon.png'],
    [180, 180, 'apple-touch-icon.png'],
    [192, 192, 'pwa-192x192.png'],
    [512, 512, 'pwa-512x512.png']
  ]
  for (const [w, h, name] of sizes) {
    const buf = await createPng(w, h, color)
    writeFileSync(join(outDir, name), buf)
    console.log('Wrote', name)
  }

  const splashBuf = await createSplash(1284, 2778, color)
  writeFileSync(join(outDir, 'splash.png'), splashBuf)
  console.log('Wrote splash.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
