import type { ODataProxyConfig } from '@bc8-odx/core'
import fs from 'node:fs'
import { XMLParser } from 'fast-xml-parser'
import { createError, defineEventHandler, getQuery } from 'h3'
import { resolve } from 'pathe'

export default defineEventHandler(async (event) => {
  const config = event.context.odataConfig as ODataProxyConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''

  if (!serviceName) {
    throw createError({ statusCode: 400, message: 'Missing service query parameter' })
  }

  const services = config.services ?? []
  const svc = services.find(s => s.name === serviceName)

  if (!svc) {
    throw createError({ statusCode: 404, message: `Service "${serviceName}" not found` })
  }

  const rootDir = config.rootDir ?? ''
  const buildDir = config.buildDir ?? ''

  let edmxPath = ''
  if (svc.url.startsWith('http')) {
    edmxPath = resolve(buildDir, 'odx/temp', `${svc.name}.edmx`)
  }
  else {
    edmxPath = resolve(rootDir, svc.url)
  }

  if (!fs.existsSync(edmxPath)) {
    console.error(`[@bc8-odx/proxy] Schema API: EDMX file not found at ${edmxPath}`)
    throw createError({ statusCode: 404, message: `EDMX file not found at ${edmxPath}` })
  }

  const xmlData = fs.readFileSync(edmxPath, 'utf-8')
  if (!xmlData || xmlData.trim().length === 0) {
    throw createError({ statusCode: 500, message: `EDMX file at ${edmxPath} is empty` })
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    })
    const jsonObj = parser.parse(xmlData) as Record<string, any>

    if (!jsonObj) {
      throw new Error('Parsed XML resulted in empty object')
    }

    const edmx = jsonObj['edmx:Edmx'] || jsonObj.Edmx
    const dataServices = edmx?.['edmx:DataServices'] || edmx?.DataServices
    const schema = Array.isArray(dataServices?.Schema) ? dataServices.Schema[0] : dataServices?.Schema

    if (!schema) {
      throw createError({ statusCode: 500, message: 'Could not find Schema in EDMX' })
    }

    const entityTypes = Array.isArray(schema.EntityType) ? schema.EntityType : (schema.EntityType ? [schema.EntityType] : [])
    const associations = Array.isArray(schema.Association) ? schema.Association : (schema.Association ? [schema.Association] : [])
    const entityContainers = Array.isArray(schema.EntityContainer) ? schema.EntityContainer : (schema.EntityContainer ? [schema.EntityContainer] : [])
    const container = entityContainers[0]
    const entitySets = Array.isArray(container?.EntitySet) ? container.EntitySet : (container?.EntitySet ? [container.EntitySet] : [])

    const result = {
      namespace: schema.Namespace,
      entities: entityTypes.map((et: any) => {
        const properties = Array.isArray(et.Property) ? et.Property : (et.Property ? [et.Property] : [])
        const navProperties = Array.isArray(et.NavigationProperty) ? et.NavigationProperty : (et.NavigationProperty ? [et.NavigationProperty] : [])
        const key = et.Key?.PropertyRef ? (Array.isArray(et.Key.PropertyRef) ? et.Key.PropertyRef.map((k: any) => k.Name) : [et.Key.PropertyRef.Name]) : []

        const entitySet = entitySets.find((es: any) => es.EntityType === `${schema.Namespace}.${et.Name}` || es.EntityType === et.Name)

        return {
          name: et.Name,
          entitySet: entitySet?.Name,
          properties: properties.map((p: any) => ({
            name: p.Name,
            type: p.Type,
            nullable: (p.Nullable || p.nullable) !== 'false',
            isKey: key.includes(p.Name),
          })),
          navigationProperties: navProperties.map((np: any) => ({
            name: np.Name,
            relationship: np.Relationship || np.relationship,
            fromRole: np.FromRole || np.fromRole,
            toRole: np.ToRole || np.toRole,
          })),
        }
      }),
      associations: associations.map((assoc: any) => {
        const ends = Array.isArray(assoc.End) ? assoc.End : [assoc.End]
        const constraint = assoc.ReferentialConstraint || assoc.referentialConstraint
        let link: any = null

        if (constraint) {
          const principal = constraint.Principal || constraint.principal
          const dependent = constraint.Dependent || constraint.dependent

          const getPropName = (ref: any): any => {
            if (!ref) {
              return null
            }
            const p = Array.isArray(ref) ? ref[0] : ref
            return p.Name || p.name
          }

          link = {
            principalRole: principal?.Role || principal?.role,
            principalProperty: getPropName(principal?.PropertyRef || principal?.propertyRef),
            dependentRole: dependent?.Role || dependent?.role,
            dependentProperty: getPropName(dependent?.PropertyRef || dependent?.propertyRef),
          }
        }

        return {
          name: assoc.Name || assoc.name,
          ends: ends.map((end: any) => ({
            role: end.Role || end.role,
            type: end.Type || end.type,
            multiplicity: end.Multiplicity || end.multiplicity,
          })),
          constraint: link,
        }
      }),

    }

    return result
  }
  catch (e: unknown) {
    const error = e as Error
    throw createError({ statusCode: 500, message: `Failed to parse EDMX: ${error.message}` })
  }
})
