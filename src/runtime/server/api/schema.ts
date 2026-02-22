import fs from 'node:fs'
import { createError, defineEventHandler, getQuery, useRuntimeConfig } from '#imports'
import { XMLParser } from 'fast-xml-parser'
import { resolve } from 'pathe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const serviceName = query.service as string

  if (!serviceName) {
    throw createError({ statusCode: 400, message: 'Missing service query parameter' })
  }

  const services = (config.odata?.services || []) as Array<{ name: string, edmx: string }>
  const svc = services.find(s => s.name === serviceName)

  if (!svc) {
    throw createError({ statusCode: 404, message: `Service "${serviceName}" not found` })
  }

  const rootDir = config.odata?.rootDir as string
  const edmxPath = resolve(rootDir, svc.edmx)

  if (!fs.existsSync(edmxPath)) {
    throw createError({ statusCode: 404, message: `EDMX file not found at ${edmxPath}` })
  }

  const xmlData = fs.readFileSync(edmxPath, 'utf-8')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  })
  const jsonObj = parser.parse(xmlData)

  // Navigate to Schema
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

      // Find which EntitySet uses this EntityType
      const entitySet = entitySets.find((es: any) => es.EntityType === `${schema.Namespace}.${et.Name}` || es.EntityType === et.Name)

      return {
        name: et.Name,
        entitySet: entitySet?.Name,
        properties: properties.map((p: any) => ({
          name: p.Name,
          type: p.Type,
          nullable: p.Nullable !== 'false',
          isKey: key.includes(p.Name),
        })),
        navigationProperties: navProperties.map((np: any) => ({
          name: np.Name,
          relationship: np.Relationship,
          fromRole: np.FromRole,
          toRole: np.ToRole,
        })),
      }
    }),
    associations: associations.map((assoc: any) => {
      const ends = Array.isArray(assoc.End) ? assoc.End : [assoc.End]
      return {
        name: assoc.Name,
        ends: ends.map((end: any) => ({
          role: end.Role,
          type: end.Type,
          multiplicity: end.Multiplicity,
        })),
      }
    }),
  }

  return result
})
