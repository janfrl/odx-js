import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = import.meta.dirname
const generatedRegistryPath = join(root, '.nuxt', 'odx-types', 'index.d.ts')
const appPath = join(root, 'app.vue')

function assertFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Expected file to exist: ${path}`)
  }
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`Expected ${label} to include: ${expected}`)
  }
}

assertFile(generatedRegistryPath)

const generatedRegistry = readFileSync(generatedRegistryPath, 'utf8')
assertIncludes(generatedRegistry, 'interface ODataServiceRegistry', 'generated registry')
assertIncludes(generatedRegistry, 'MinimalLocal: ODataService<"Products"', 'generated registry')
assertIncludes(generatedRegistry, '"Products": MinimalLocalModels.Product', 'generated registry')

const app = readFileSync(appPath, 'utf8')
assertIncludes(app, 'ODataServiceRegistry[\'MinimalLocal\']', 'minimal app')
assertIncludes(app, 'minimalService.Products', 'minimal app')
assertIncludes(app, '$select', 'minimal app')

console.warn('Minimal Nuxt ODX playground verified.')
