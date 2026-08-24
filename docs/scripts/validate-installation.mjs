import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import process from 'node:process'

const contentRoot = join(process.cwd(), 'content')
const installCommand = /(?:pnpm add|npm install|yarn add) @me-tools\/odx-/u

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? markdownFiles(join(directory, entry.name))
    : entry.name.endsWith('.md') ? [join(directory, entry.name)] : []))
  return nested.flat()
}

const files = await markdownFiles(contentRoot)
const installationPages = []
const issues = []

for (const file of files) {
  const source = await readFile(file, 'utf8')
  if (!installCommand.test(source))
    continue

  const page = relative(process.cwd(), file).replaceAll('\\', '/')
  installationPages.push(page)
  if (!/^packageAvailability: unpublished$/mu.test(source))
    issues.push(`${page} must declare packageAvailability: unpublished.`)
  if (!/::warning[\s\S]*?not yet available from npm|::warning[\s\S]*?noch kein ODX-Paket ist über npm verfügbar/iu.test(source))
    issues.push(`${page} must visibly explain that registry installation is not available.`)
}

if (installationPages.length === 0)
  issues.push('No public ODX installation pages were found.')

if (issues.length > 0)
  throw new Error(`Invalid public installation documentation:\n- ${issues.join('\n- ')}`)

process.stdout.write(`Validated unpublished-package guidance on ${installationPages.length} installation pages.\n`)
