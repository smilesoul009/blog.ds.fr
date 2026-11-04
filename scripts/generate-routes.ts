import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiDir = resolve(__dirname, '../server/api')

const METHODS = [
  { file: 'index.get.ts', method: 'list' },
  { file: 'index.post.ts', method: 'create' },
  { file: '[id].get.ts', method: 'detail' },
  { file: '[id].patch.ts', method: 'update' },
  { file: '[id].delete.ts', method: 'delete' }
] as const

const args = process.argv.slice(2)
if (!args.length) {
  console.error('Использование: pnpm gen:routes area,space,article')
  console.error('              pnpm gen:routes area --only=list,detail')
  process.exit(1)
}

const onlyArg = args.find(a => a.startsWith('--only='))
const only = onlyArg
  ? onlyArg.replace('--only=', '').split(',').map(s => s.trim())
  : null

const names = args
  .filter(a => !a.startsWith('--'))
  .flatMap(a => a.split(','))
  .map(s => s.trim())
  .filter(Boolean)

function plural(singular: string) {
  if (singular.endsWith('y')) return `${singular.slice(0, -1)}ies`
  if (/(s|sh|ch|x|z)$/.test(singular)) return `${singular}es`
  return `${singular}s`
}

for (const singular of names) {
  const dir = resolve(apiDir, plural(singular))
  mkdirSync(dir, { recursive: true })

  for (const { file, method } of METHODS) {
    if (only && !only.includes(method)) continue

    const path = resolve(dir, file)
    if (existsSync(path)) {
      console.log(`пропущен (уже есть): ${plural(singular)}/${file}`)
      continue
    }

    const content
      = `import { ${singular}Controller } from '#server/controllers/${singular}'\n`
        + `\n`
        + `export default ${singular}Controller.${method}\n`

    writeFileSync(path, content, 'utf8')
    console.log(`создан: ${plural(singular)}/${file}`)
  }
}
