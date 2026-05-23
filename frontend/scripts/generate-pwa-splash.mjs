/**
 * PWA startup/splash only — from logo-bg2.png (does not touch app icons).
 * App icons stay on logo.jpeg via generate-pwa-icons.mjs (Flaticon attribution in Settings).
 * Run: npm run pwa-assets
 */
import sharp from 'sharp'
import { mkdir, copyFile } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const source = join(root, 'src', 'assets', 'logo-bg2.png')
const splashDir = join(root, 'public', 'splash')

/** Solid background on logo-bg2.png */
const BG = '#000000'

/** Portrait startup canvases (width × height). Media queries match Apple PWA conventions. */
const IOS_STARTUP = [
  {
    file: 'iphone-se-640x1136.png',
    width: 640,
    height: 1136,
    media:
      '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    file: 'iphone8-750x1334.png',
    width: 750,
    height: 1334,
    media:
      '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    file: 'iphone8plus-1242x2208.png',
    width: 1242,
    height: 2208,
    media:
      '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    file: 'iphonex-1125x2436.png',
    width: 1125,
    height: 2436,
    media:
      '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    file: 'iphone12-1170x2532.png',
    width: 1170,
    height: 2532,
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    file: 'iphone12max-1284x2778.png',
    width: 1284,
    height: 2778,
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    file: 'iphone14pro-1179x2556.png',
    width: 1179,
    height: 2556,
    media:
      '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    file: 'iphone14promax-1290x2796.png',
    width: 1290,
    height: 2796,
    media:
      '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
]

await access(source)

await mkdir(splashDir, { recursive: true })

const logoMeta = await sharp(source).metadata()
const logoW = logoMeta.width ?? 707
const logoH = logoMeta.height ?? 353

/** Optimized splash asset (precache-friendly). */
await sharp(source)
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(join(splashDir, 'logo-bg2.png'))

/** Keep branding path in sync for PDFs / API references. */
const brandingDir = join(root, 'public', 'branding')
await mkdir(brandingDir, { recursive: true })
await copyFile(join(splashDir, 'logo-bg2.png'), join(brandingDir, 'logo-bg2.png'))

for (const { file, width, height } of IOS_STARTUP) {
  const maxW = Math.round(width * 0.88)
  const maxH = Math.round(height * 0.28)
  const scale = Math.min(maxW / logoW, maxH / logoH, 1)
  const targetW = Math.round(logoW * scale)
  const targetH = Math.round(logoH * scale)

  const resized = await sharp(source)
    .resize(targetW, targetH, { fit: 'inside' })
    .toBuffer()

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(join(splashDir, file))
}

console.info(
  'PWA splash from logo-bg2.png: public/splash/logo-bg2.png and',
  IOS_STARTUP.length,
  'iOS startup images (icons unchanged).',
)
