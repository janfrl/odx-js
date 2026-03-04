import type { Association, AssociationEnd, EntityMapping, EntityProperty, NavigationProperty } from './types.ts'
import fs from 'node:fs'

/**
 * Robustly extracts attributes from an XML-like tag string.
 */
function getAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const matches = tag.matchAll(/([\w:-]+)="([^"]*)"/g)
  for (const match of matches) {
    const rawKey = match[1]!
    const value = match[2]!
    attrs[rawKey] = value
    const parts = rawKey.split(':')
    const key = parts[parts.length - 1]!
    attrs[key] = value
  }
  return attrs
}

/**
 * Extracts entity set names, their types, properties and navigation properties from an EDMX file.
 */
export function extractEntitiesFromEdmx(edmxPath: string): EntityMapping[] {
  if (!fs.existsSync(edmxPath))
    return []
  try {
    const xml = fs.readFileSync(edmxPath, 'utf-8')
    const mappings: EntityMapping[] = []

    const entityTypes: Record<string, { properties: EntityProperty[], navProps: NavigationProperty[] }> = {}
    const typeBlocks = xml.split(/<[\w:]*EntityType\s/i).slice(1)

    for (const block of typeBlocks) {
      const tagEnd = block.indexOf('>')
      if (tagEnd === -1)
        continue
      const tagHeader = block.slice(0, tagEnd)
      const typeAttrs = getAttributes(tagHeader)
      const typeName = typeAttrs.Name
      if (!typeName)
        continue

      const blockContent = block.slice(tagEnd).split(/<\/[\w:]*EntityType>/i)[0] || ''

      // Extract Keys
      const keyNames: string[] = []
      const contentLower = blockContent.toLowerCase()
      const keyBlockStart = contentLower.indexOf('<key>')
      const keyBlockEnd = contentLower.indexOf('</key>')
      if (keyBlockStart !== -1 && keyBlockEnd !== -1) {
        const keyBlock = blockContent.slice(keyBlockStart + 5, keyBlockEnd)
        const krParts = keyBlock.split(/<[\w:]*PropertyRef\s/i).slice(1)
        for (const kr of krParts) {
          const krTagEnd = kr.indexOf('>')
          if (krTagEnd === -1)
            continue
          const krAttrs = getAttributes(kr.slice(0, krTagEnd))
          if (krAttrs.Name)
            keyNames.push(krAttrs.Name)
        }
      }

      // Extract Properties
      const properties: EntityProperty[] = []
      const propParts = blockContent.split(/<[\w:]*\bProperty\s/i).slice(1)
      for (const p of propParts) {
        const pTagEnd = p.indexOf('>')
        if (pTagEnd === -1)
          continue
        const pAttrs = getAttributes(p.slice(0, pTagEnd))
        if (pAttrs.Name && pAttrs.Type) {
          properties.push({
            name: pAttrs.Name,
            type: pAttrs.Type,
            isKey: keyNames.includes(pAttrs.Name),
          })
        }
      }

      // Extract Navigation Properties
      const navProps: NavigationProperty[] = []
      const navParts = blockContent.split(/<[\w:]*\bNavigationProperty\s/i).slice(1)
      for (const n of navParts) {
        const nTagEnd = n.indexOf('>')
        if (nTagEnd === -1)
          continue
        const nAttrs = getAttributes(n.slice(0, nTagEnd))
        if (nAttrs.Name) {
          navProps.push({
            name: nAttrs.Name,
            relationship: nAttrs.Relationship || nAttrs.Type || '',
            fromRole: nAttrs.FromRole || '',
            toRole: nAttrs.ToRole || '',
          })
        }
      }

      entityTypes[typeName] = { properties, navProps }
    }

    const entitySetParts = xml.split(/<[\w:]*EntitySet\s/i).slice(1)
    for (const s of entitySetParts) {
      const sTagEnd = s.indexOf('>')
      if (sTagEnd === -1)
        continue
      const setAttrs = getAttributes(s.slice(0, sTagEnd))
      const setName = setAttrs.Name
      const entityTypeFull = setAttrs.EntityType
      if (!setName || !entityTypeFull)
        continue

      const typeName = entityTypeFull.split('.').pop()!
      const typeInfo = entityTypes[typeName] || { properties: [], navProps: [] }

      mappings.push({
        name: setName,
        type: typeName,
        properties: typeInfo.properties,
        navigationProperties: typeInfo.navProps,
      })
    }

    return mappings
  }
  catch {
    return []
  }
}

/**
 * Extracts associations from an EDMX file.
 */
export function extractAssociationsFromEdmx(edmxPath: string): Association[] {
  if (!fs.existsSync(edmxPath))
    return []
  try {
    const xml = fs.readFileSync(edmxPath, 'utf-8')
    const associations: Association[] = []

    const assocParts = xml.split(/<[\w:]*Association\s/i).slice(1)
    for (const a of assocParts) {
      const aTagEnd = a.indexOf('>')
      if (aTagEnd === -1)
        continue
      const attrs = getAttributes(a.slice(0, aTagEnd))
      const name = attrs.Name
      if (!name)
        continue

      const body = a.slice(aTagEnd).split(/<\/[\w:]*Association>/i)[0] || ''
      const ends: AssociationEnd[] = []

      const endParts = body.split(/<[\w:]*End\s/i).slice(1)
      for (const e of endParts) {
        const eTagEnd = e.indexOf('>')
        if (eTagEnd === -1)
          continue
        const eAttrs = getAttributes(e.slice(0, eTagEnd))
        if (eAttrs.Type && eAttrs.Role && eAttrs.Multiplicity) {
          ends.push({
            type: eAttrs.Type,
            role: eAttrs.Role,
            multiplicity: eAttrs.Multiplicity,
          })
        }
      }

      associations.push({ name, ends })
    }
    return associations
  }
  catch {
    return []
  }
}

/**
 * Detects the OData version from an EDMX file.
 */
export function detectODataVersion(edmxPath: string): 'v2' | 'v4' | null {
  if (!fs.existsSync(edmxPath))
    return null
  try {
    const content = fs.readFileSync(edmxPath, 'utf-8').slice(0, 3000)
    if (content.includes('Version="4.0"'))
      return 'v4'
    if (content.includes('DataServiceVersion="2.0"') || content.includes('DataServiceVersion="1.0"'))
      return 'v2'
    return content.includes('http://docs.oasis-open.org/odata/ns/edmx') ? 'v4' : 'v2'
  }
  catch {
    return null
  }
}
