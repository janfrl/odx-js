import type { Association, AssociationEnd, EntityMapping, EntityProperty, NavigationProperty } from './types.ts'
import fs from 'node:fs'

const RE_XML_ATTRIBUTES = /([\w:-]+)="([^"]*)"/g
const RE_ENTITY_TYPE_OPEN = /<[\w:]*EntityType\s/i
const RE_ENTITY_TYPE_CLOSE = /<\/[\w:]*EntityType>/i
const RE_PROPERTY_REF = /<[\w:]*PropertyRef\s/i
const RE_PROPERTY = /<[\w:]*\bProperty\s/i
const RE_NAVIGATION_PROPERTY = /<[\w:]*\bNavigationProperty\s/i
const RE_ENTITY_SET = /<[\w:]*EntitySet\s/i
const RE_ASSOCIATION_OPEN = /<[\w:]*Association\s/i
const RE_ASSOCIATION_CLOSE = /<\/[\w:]*Association>/i
const RE_END = /<[\w:]*End\s/i

/**
 * Robustly extracts attributes from an XML-like tag string.
 */
function getAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const matches = tag.matchAll(RE_XML_ATTRIBUTES)
  for (const match of matches) {
    const rawKey = match[1]!
    const value = match[2]!
    attrs[rawKey] = value
    const parts = rawKey.split(':')
    const key = parts.at(-1)!
    attrs[key] = value
  }
  return attrs
}

/**
 * Extracts entity set names, their types, properties and navigation properties from an EDMX file.
 */
export function extractEntitiesFromEdmxContent(xml: string): EntityMapping[] {
  try {
    const mappings: EntityMapping[] = []

    const entityTypes: Record<string, { properties: EntityProperty[], navProps: NavigationProperty[] }> = {}
    const typeBlocks = xml.split(RE_ENTITY_TYPE_OPEN).slice(1)

    for (const block of typeBlocks) {
      const tagEnd = block.indexOf('>')
      if (tagEnd === -1)
        continue
      const tagHeader = block.slice(0, tagEnd)
      const typeAttrs = getAttributes(tagHeader)
      const typeName = typeAttrs.Name
      if (!typeName)
        continue

      const blockContent = block.slice(tagEnd).split(RE_ENTITY_TYPE_CLOSE)[0] || ''

      // Extract Keys
      const keyNames: string[] = []
      const contentLower = blockContent.toLowerCase()
      const keyBlockStart = contentLower.indexOf('<key>')
      const keyBlockEnd = contentLower.indexOf('</key>')
      if (keyBlockStart !== -1 && keyBlockEnd !== -1) {
        const keyBlock = blockContent.slice(keyBlockStart + 5, keyBlockEnd)
        const krParts = keyBlock.split(RE_PROPERTY_REF).slice(1)
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
      const propParts = blockContent.split(RE_PROPERTY).slice(1)
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
      const navParts = blockContent.split(RE_NAVIGATION_PROPERTY).slice(1)
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

    const entitySetParts = xml.split(RE_ENTITY_SET).slice(1)
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

export function extractEntitiesFromEdmx(edmxPath: string): EntityMapping[] {
  if (!fs.existsSync(edmxPath))
    return []
  return extractEntitiesFromEdmxContent(fs.readFileSync(edmxPath, 'utf-8'))
}

/**
 * Extracts associations from an EDMX file.
 */
export function extractAssociationsFromEdmxContent(xml: string): Association[] {
  try {
    const associations: Association[] = []

    const assocParts = xml.split(RE_ASSOCIATION_OPEN).slice(1)
    for (const a of assocParts) {
      const aTagEnd = a.indexOf('>')
      if (aTagEnd === -1)
        continue
      const attrs = getAttributes(a.slice(0, aTagEnd))
      const name = attrs.Name
      if (!name)
        continue

      const body = a.slice(aTagEnd).split(RE_ASSOCIATION_CLOSE)[0] || ''
      const ends: AssociationEnd[] = []

      const endParts = body.split(RE_END).slice(1)
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

export function extractAssociationsFromEdmx(edmxPath: string): Association[] {
  if (!fs.existsSync(edmxPath))
    return []
  return extractAssociationsFromEdmxContent(fs.readFileSync(edmxPath, 'utf-8'))
}

/**
 * Detects the OData version from an EDMX file.
 */
export function detectODataVersionFromContent(content: string): 'v2' | 'v4' | null {
  try {
    const head = content.slice(0, 3000)
    if (head.includes('Version="4.0"'))
      return 'v4'
    if (head.includes('DataServiceVersion="2.0"') || head.includes('DataServiceVersion="1.0"'))
      return 'v2'
    return head.includes('http://docs.oasis-open.org/odata/ns/edmx') ? 'v4' : 'v2'
  }
  catch {
    return null
  }
}

export function detectODataVersion(edmxPath: string): 'v2' | 'v4' | null {
  if (!fs.existsSync(edmxPath))
    return null
  return detectODataVersionFromContent(fs.readFileSync(edmxPath, 'utf-8'))
}
