import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

const pages = [
  ['English', 'en/2.nuxt/2.usage.md'],
  ['German', 'de/2.nuxt/2.usage.md'],
]

const requiredContracts = [
  'supportsV2FunctionImports',
  'invokeFunctionImport',
  'supportsV2AtomicActionChangesets',
  'supportsV2AtomicRootMutations',
  'v2ChangeSet',
  'function-import',
  'If-Match',
]

const issues = []

for (const [language, page] of pages) {
  const source = await readFile(join(process.cwd(), 'content', page), 'utf8')
  for (const contract of requiredContracts) {
    if (!source.includes(contract))
      issues.push(`${language} Nuxt usage is missing ${contract}.`)
  }
}

if (issues.length > 0)
  throw new Error(`Incomplete V2 FunctionImport guidance:\n- ${issues.join('\n- ')}`)

process.stdout.write('Validated direct and atomic V2 FunctionImport guidance in English and German.\n')
