import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { Project, Node, type InterfaceDeclaration, type TypeAliasDeclaration, type FunctionDeclaration, type JSDocableNode } from 'ts-morph'
import consola from 'consola'

/**
 * Represents a single property of an interface/type or a parameter of a function.
 */
export interface ApiProperty {
  name: string
  type: string
  default?: string
  description?: string
  required: boolean
}

/**
 * Represents a single exported symbol (Interface, Type, or Function).
 */
export interface ApiItem {
  title: string
  description?: string
  properties: ApiProperty[]
}

export type ApiReference = Record<string, ApiItem>

const DEFAULT_ENTRY_POINTS = [
  'packages/core/src/index.ts',
  'packages/nuxt/src/module.ts'
]

const DEFAULT_OUTPUT_PATH = 'docs/public/api-reference.json'

/**
 * Extracts JSDoc description and @default tag from a node.
 */
function getDocs(node: any) {
  if (!node || typeof node.getJsDocs !== 'function') {
    return { description: undefined, defaultValue: undefined }
  }
  
  const docs = node.getJsDocs()
  if (docs.length === 0) return { description: undefined, defaultValue: undefined }

  const doc = docs[0]
  const description = doc.getDescription().trim().replace(/\r\n/g, '\n') || undefined
  const defaultTag = doc.getTags().find(tag => tag.getTagName() === 'default')
  const defaultValue = defaultTag?.getComment()?.toString().trim().replace(/\r\n/g, '\n') || undefined

  return { description, defaultValue }
}

/**
 * Normalizes type text for better readability.
 */
function normalizeType(typeText: string): string {
  return typeText.replace(/import\(.*?\)\./g, '').trim()
}

/**
 * Extracts properties from an interface.
 */
export function extractInterface(node: InterfaceDeclaration): ApiItem {
  const { description } = getDocs(node)
  const properties: ApiProperty[] = node.getProperties().map(p => {
    const { description: propDesc, defaultValue } = getDocs(p)
    return {
      name: p.getName(),
      type: normalizeType(p.getType().getText()),
      description: propDesc,
      default: defaultValue,
      required: !p.hasQuestionToken(),
    }
  })

  return {
    title: node.getName(),
    description,
    properties,
  }
}

/**
 * Extracts properties from a type alias (if it's an object type).
 */
export function extractTypeAlias(node: TypeAliasDeclaration): ApiItem | undefined {
  const typeNode = node.getTypeNode()
  if (!typeNode || !Node.isTypeLiteral(typeNode)) return undefined

  const { description } = getDocs(node)
  const properties: ApiProperty[] = typeNode.getProperties().map(p => {
    const { description: propDesc, defaultValue } = getDocs(p)
    return {
      name: p.getName(),
      type: normalizeType(p.getType().getText()),
      description: propDesc,
      default: defaultValue,
      required: !p.hasQuestionToken(),
    }
  })

  return {
    title: node.getName(),
    description,
    properties,
  }
}

/**
 * Extracts parameters from a function as properties.
 */
export function extractFunction(node: FunctionDeclaration): ApiItem | undefined {
  const name = node.getName()
  if (!name) return undefined

  const { description } = getDocs(node)
  
  // Also look for @param tags in the function's JSDoc
  const paramDocs: Record<string, string> = {}
  const docs = node.getJsDocs()
  if (docs.length > 0) {
    const doc = docs[0]
    doc.getTags().forEach(tag => {
      if (Node.isJSDocParameterTag(tag)) {
        const paramName = tag.getName()
        const comment = tag.getComment()?.toString().trim()
        if (paramName && comment) {
          paramDocs[paramName] = comment
        }
      }
    })
  }

  const properties: ApiProperty[] = node.getParameters().map(p => {
    const pName = p.getName()
    const { description: directDesc, defaultValue } = getDocs(p)
    return {
      name: pName,
      type: normalizeType(p.getType().getText()),
      description: directDesc || paramDocs[pName],
      default: defaultValue || (p.getInitializer()?.getText()),
      required: !p.hasQuestionToken() && !p.getInitializer(),
    }
  })

  return {
    title: name,
    description,
    properties,
  }
}

async function main() {
  consola.start('API Reference Extractor: Initializing...')
  
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  })

  const apiReference: ApiReference = {}

  for (const entryPath of DEFAULT_ENTRY_POINTS) {
    const fullPath = resolve(entryPath)
    const sourceFile = project.addSourceFileAtPathIfExists(fullPath)
    if (!sourceFile) {
      consola.warn(`Entry point not found: ${entryPath}`)
      continue
    }

    consola.info(`Processing ${entryPath}...`)

    const exports = sourceFile.getExportedDeclarations()
    
    for (const [name, declarations] of exports) {
      for (const declaration of declarations) {
        let item: ApiItem | undefined

        try {
          if (Node.isInterfaceDeclaration(declaration)) {
            item = extractInterface(declaration)
          } else if (Node.isTypeAliasDeclaration(declaration)) {
            item = extractTypeAlias(declaration)
          } else if (Node.isFunctionDeclaration(declaration)) {
            item = extractFunction(declaration)
          }

          if (item) {
            apiReference[name] = item
          }
        } catch (error) {
          consola.error(`Failed to extract metadata for "${name}" in ${entryPath}:`, error)
        }
      }
    }
  }

  try {
    const outputPath = resolve(DEFAULT_OUTPUT_PATH)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, JSON.stringify(apiReference, null, 2), 'utf-8')

    consola.success(`API Reference saved to ${DEFAULT_OUTPUT_PATH}`)
    consola.info(`Total items extracted: ${Object.keys(apiReference).length}`)
  } catch (error) {
    consola.error('Failed to save API reference JSON:', error)
    process.exit(1)
  }
}

if (import.meta.url.startsWith('file:') || process.argv[1] === resolve(import.meta.url.replace('file:///', ''))) {
  main().catch(error => {
    consola.error('Fatal error during API extraction:', error)
    process.exit(1)
  })
}
