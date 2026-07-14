import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createJiti } from 'jiti'

async function main() {
  const jiti = createJiti(import.meta.url, {
    interopDefault: true,
    alias: {
      '@me-tools/odx-core/server': resolve('../packages/core/src/server.ts'),
      '@me-tools/odx-core': resolve('../packages/core/src/index.ts'),
    },
  })

  const modulePath = resolve('../packages/nuxt/src/module.ts')
  const mod = await jiti.import(modulePath) as any

  const outputDir = resolve('.data')
  mkdirSync(outputDir, { recursive: true })

  const metadata = {
    name: mod.default?.meta?.name || mod.meta?.name,
    configKey: mod.default?.meta?.configKey || mod.meta?.configKey,
    defaults: mod.default?.defaults || mod.defaults,
  }

  writeFileSync(
    resolve(outputDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8',
  )

  console.log('✓ Metadata extracted from module to docs/.data/metadata.json')
}

main().catch(console.error)
