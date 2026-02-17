import { defineEventHandler, useRuntimeConfig } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const odataConfig = config.odata
  const services = (odataConfig?.services || []) as any[]
  
  const servicesWithEntities = await Promise.all(services.map(async (svc) => {
    const buildDir = odataConfig?.buildDir as string
    const generatedDir = join(buildDir, 'sap-odata', 'generated', svc.name)
    
    // The SDK generator often puts the files in a subfolder named after the service
    // Let's check for an index.js in any direct subfolder if it's not in the root
    let indexFile = join(generatedDir, 'index.js')
    if (!fs.existsSync(indexFile) && fs.existsSync(generatedDir)) {
      const subdirs = fs.readdirSync(generatedDir).filter(f => fs.statSync(join(generatedDir, f)).isDirectory())
      for (const subdir of subdirs) {
        const potentialIndex = join(generatedDir, subdir, 'index.js')
        if (fs.existsSync(potentialIndex)) {
          indexFile = potentialIndex
          break
        }
      }
    }
    
    let entities: string[] = []
    let isGenerated = false

    if (fs.existsSync(indexFile)) {
      isGenerated = true
      try {
        const sdk = await import(pathToFileURL(indexFile).href)
        
        // In SDK v3, we look for service factories and then for getters on the instance
        const serviceFactoryKey = Object.keys(sdk).find(k => 
          typeof sdk[k] === 'function' && 
          (k.toLowerCase() === svc.name.toLowerCase() || k.toLowerCase() === svc.name.toLowerCase() + 'api' || k === 'dummy')
        )

        if (serviceFactoryKey) {
          const serviceInstance = sdk[serviceFactoryKey]()
          
          const getAllPropertyNames = (obj: any) => {
            const props = new Set<string>()
            let current = obj
            while (current && current !== Object.prototype) {
              Object.getOwnPropertyNames(current).forEach(p => props.add(p))
              current = Object.getPrototypeOf(current)
            }
            return Array.from(props)
          }

          const allProps = getAllPropertyNames(serviceInstance)
          const found = allProps.filter(key => {
            if (['constructor', 'initApi', 'batch', 'changeset'].includes(key) || key.startsWith('_')) return false
            try {
              const potentialApi = serviceInstance[key]
              return potentialApi && typeof potentialApi === 'object' && potentialApi.requestBuilder
            } catch { return false }
          })
          
          // Clean up names: remove 'Api' suffix if it exists for the UI
          entities = found.map(name => name.endsWith('Api') ? name.slice(0, -3) : name)
          // Capitalize first letter to match EDMX/expected style
          entities = entities.map(name => name.charAt(0).toUpperCase() + name.slice(1))
        }
        
      } catch (e) {
        console.warn(`[nuxt-sap-odata] Could not inspect entities for ${svc.name}`, e)
      }
    }

    return {
      ...svc,
      isGenerated,
      entities
    }
  }))

  return {
    basePath: config.public.odata?.basePath || '/api/sap-odata',
    mode: config.public.odata?.mode || 'sdk',
    services: servicesWithEntities,
    buildDir: odataConfig?.buildDir,
    forwardAuthHeader: odataConfig?.forwardAuthHeader
  }
})
