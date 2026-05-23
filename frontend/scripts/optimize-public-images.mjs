/**
 * Compress PNGs and emit WebP siblings for layout/login assets (run via prebuild).
 */
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const roots = [
  path.join(__dirname, '../public'),
  path.join(__dirname, '../src/assets'),
]

const SKIP_DIRS = new Set(['splash', 'icons', 'signatures'])

async function walk(dir, files = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue
      await walk(full, files)
    } else if (ent.isFile() && /\.png$/i.test(ent.name)) {
      files.push(full)
    }
  }
  return files
}

async function optimizeFile(filePath) {
  const info = await stat(filePath)
  if (info.size < 8 * 1024) return

  const image = sharp(filePath)
  const meta = await image.metadata()
  const maxSide = Math.max(meta.width ?? 0, meta.height ?? 0)
  const pipeline =
    maxSide > 1400
      ? image.resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      : image

  const pngBuf = await pipeline.clone().png({ compressionLevel: 9, palette: meta.hasAlpha }).toBuffer()
  if (pngBuf.length < info.size) {
    await sharp(pngBuf).toFile(filePath)
  }

  const webpPath = filePath.replace(/\.png$/i, '.webp')
  await pipeline.clone().webp({ quality: 82, effort: 4 }).toFile(webpPath)
}

const all = []
for (const root of roots) {
  all.push(...(await walk(root)))
}

for (const file of all) {
  try {
    await optimizeFile(file)
    console.info('[optimize-images]', path.relative(path.join(__dirname, '..'), file))
  } catch (err) {
    console.warn('[optimize-images] skip', file, err?.message ?? err)
  }
}
