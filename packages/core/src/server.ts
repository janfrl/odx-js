import fs from 'node:fs'

export interface EntityMapping {
  name: string
  type: string
}

/**
 * Extracts entity set names and their types from an EDMX file.
 */
export function extractEntitiesFromEdmx(edmxPath: string): EntityMapping[] {
  if (!fs.existsSync(edmxPath)) {
    return []
  }
  try {
    const content = fs.readFileSync(edmxPath, 'utf-8')
    const mappings: EntityMapping[] = []
    const regex = /<EntitySet\s+Name="([^"]+)"\s+EntityType="([^"]+)"/g
    let match = regex.exec(content)
    while (match !== null) {
      if (match[1] && match[2]) {
        // Strip namespace from EntityType if present
        const type = match[2].split('.').pop() || match[2]
        mappings.push({ name: match[1], type })
      }
      match = regex.exec(content)
    }
    return mappings
  }
  catch (e) {
    console.error(`[nuxt-sap-odata] Failed to parse EDMX at ${edmxPath}`, e)
    return []
  }
}

/**
 * Detects the OData version from an EDMX file.
 */
export function detectODataVersion(edmxPath: string): 'v2' | 'v4' | null {
  if (!fs.existsSync(edmxPath)) {
    return null
  }
  try {
    const content = fs.readFileSync(edmxPath, 'utf-8').slice(0, 3000)

    if (content.includes('Version="4.0"')) {
      return 'v4'
    }
    if (content.includes('DataServiceVersion="2.0"') || content.includes('DataServiceVersion="1.0"')) {
      return 'v2'
    }

    if (content.includes('http://schemas.microsoft.com/ado/2007/06/edmx')) {
      return 'v2'
    }
    if (content.includes('http://docs.oasis-open.org/odata/ns/edmx')) {
      return 'v4'
    }

    return null
  }
  catch {
    return null
  }
}
