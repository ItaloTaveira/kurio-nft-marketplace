import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
const directory = 'src/shared/assets/figma'
let original = 0, optimized = 0
for (const file of (await readdir(directory)).filter(file => file.endsWith('.png'))) {
  const source = path.join(directory, file)
  const target = source.replace(/\.png$/, '.webp')
  await sharp(source).webp({ quality: 88, effort: 6 }).toFile(target)
  original += (await stat(source)).size; optimized += (await stat(target)).size
}
console.log(JSON.stringify({ originalBytes: original, optimizedBytes: optimized, reductionPercent: Math.round((1-optimized/original)*100) }))
