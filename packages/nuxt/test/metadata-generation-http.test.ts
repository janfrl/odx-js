import type { Nuxt } from '@nuxt/schema'
import { Buffer } from 'node:buffer'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { expect, it } from 'vitest'
import { setupTypeGeneration } from '../src/generate'

it('fails fresh preparation on HTTP failure and preserves a valid SDK cache across malformed downloads and outages', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'odx-metadata-http-'))
  const xml = readFileSync(fileURLToPath(new URL('../playground/minimal/edmx/minimal.edmx', import.meta.url)), 'utf8')
    .replace('<EntityType Name="Product">', '<EntityType Name="Product"><Annotation Term="com.sap.vocabularies.Common.v1.Label" String="Größe € 商品 🚚"/>')
  let servedXml = xml
  let available = false
  let malformedXml: string | undefined
  let interrupted = false
  const requests: string[] = []
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`)
    if (request.headers['x-catalog-key'] !== 'service-key'
      || request.headers['x-tenant'] !== 'fixture-tenant'
      || request.headers.authorization !== 'Bearer fixture-service-token'
      || request.headers.accept !== 'application/xml, text/xml, */*'
      || request.headers['content-length'] !== undefined
      || request.headers['proxy-authorization'] !== undefined
      || request.headers['accept-encoding'] !== undefined
      || request.headers['x-build-hop'] !== undefined) {
      response.writeHead(403)
      response.end('Metadata headers required')
      return
    }
    response.writeHead(available ? 200 : 503, { 'content-type': 'application/xml' })
    if (interrupted) {
      response.flushHeaders()
      response.write('<edmx:Edmx>')
      setTimeout(() => response.destroy(), 25)
      return
    }
    if (available && malformedXml === undefined) {
      const bytes = Buffer.from(servedXml, 'utf8')
      const split = bytes.indexOf(Buffer.from('ö')) + 1
      response.flushHeaders()
      response.write(bytes.subarray(0, split))
      setTimeout(() => response.end(bytes.subarray(split)), 25)
      return
    }
    response.end(available ? malformedXml ?? servedXml : 'Unavailable')
  })

  try {
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Expected a loopback TCP server')
    const serviceUrl = `http://127.0.0.1:${address.port}/odata?sap-client=100&sap-language=DE`

    async function prepare(buildName: string, modelName = 'MinimalLocal') {
      const buildDir = join(rootDir, buildName)
      let prepareTypes: ((payload: { references: { path: string }[] }) => Promise<void>) | undefined
      const nuxt = {
        options: { rootDir, buildDir },
        hook(name: string, callback: typeof prepareTypes) {
          if (name === 'prepare:types')
            prepareTypes = callback
        },
      } as unknown as Nuxt
      setupTypeGeneration(nuxt, {
        basePath: '/api/odx',
        buildDir,
        mode: 'sdk',
        rootDir,
        headers: { 'X-Catalog-Key': 'global-key', 'X-Tenant': 'fixture-tenant', 'Accept': 'application/json' },
        auth: { bearerToken: 'fixture-global-token' },
        services: [{
          name: 'Catalog',
          url: serviceUrl,
          headers: {
            'x-catalog-key': 'service-key',
            'accept': 'application/json',
            'authorization': 'Custom service header',
            'Content-Length': '999',
            'Accept-Encoding': 'gzip',
            'Proxy-Authorization': 'Basic proxy-fixture',
            'Connection': 'x-build-hop',
            'X-Build-Hop': 'hop-fixture',
          },
          auth: { bearerToken: 'fixture-service-token' },
        }],
      })
      if (!prepareTypes)
        throw new Error('Missing type preparation hook')
      const references: { path: string }[] = []
      await prepareTypes({ references })
      expect(references).toEqual([{ path: join(buildDir, 'odx-types', 'index.d.ts').replaceAll('\\', '/') }])
      expect(readFileSync(join(buildDir, 'odx-types', 'index.d.ts'), 'utf8'))
        .toContain('Catalog: ODataRuntimeService<"Products", { "Products": CatalogModels.Product }>')
      expect(readdirSync(join(buildDir, 'odx-types', 'Catalog'))).toContain(`${modelName}Model.ts`)
      expect(readFileSync(join(buildDir, 'odx-types', 'index.d.ts'), 'utf8'))
        .toContain(`from "./Catalog/${modelName}Model"`)
    }

    await expect(prepare('.nuxt')).rejects.toMatchObject({
      message: 'Could not download metadata for Catalog and no cached metadata is available.',
      cause: { message: 'Status: 503' },
    })
    expect(existsSync(join(rootDir, '.nuxt', 'odx-types', 'index.d.ts'))).toBe(false)

    available = true
    await prepare('.nuxt')
    for (const cachePath of [
      join(rootDir, '.nuxt', 'odx', 'temp', 'Catalog.edmx'),
      join(rootDir, '.odx', 'cache', 'Catalog.edmx'),
    ]) {
      expect(readFileSync(cachePath, 'utf8')).toBe(xml)
    }
    const modelPath = join(rootDir, '.nuxt', 'odx-types', 'Catalog', 'MinimalLocalModel.ts')
    expect(readFileSync(modelPath, 'utf8')).toContain('Name: string | null')
    servedXml = xml.replace('Name="Name" Type="Edm.String"', 'Name="Label" Type="Edm.String"')
    await prepare('.nuxt')
    const updatedModel = readFileSync(modelPath, 'utf8')
    expect(updatedModel).toContain('Label: string | null')
    expect(updatedModel).not.toContain('Name: string | null')
    const notePath = join(rootDir, '.nuxt', 'odx-types', 'Catalog', 'consumer-note.txt')
    writeFileSync(notePath, 'preserve unrelated artifacts')
    servedXml = servedXml.replaceAll('MinimalLocal', 'Renamed')
    await prepare('.nuxt', 'Renamed')
    expect(readFileSync(join(rootDir, '.nuxt', 'odx-types', 'Catalog', 'RenamedModel.ts'), 'utf8'))
      .toContain('Label: string | null')
    expect(readFileSync(notePath, 'utf8')).toBe('preserve unrelated artifacts')
    const consumerPath = join(rootDir, 'consumer.ts')
    writeFileSync(consumerPath, [
      'import type { Product } from "./.nuxt/odx-types/Catalog/RenamedModel"',
      'const product: Product = { ID: "1", Label: "Renamed", Price: 100 }',
      '// @ts-expect-error the removed metadata property must not survive in generated types',
      'type StaleName = Product["Name"]',
      'export { product }',
    ].join('\n'))
    const program = ts.createProgram([consumerPath], {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    })
    expect(ts.getPreEmitDiagnostics(program).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
    interrupted = true
    await prepare('.nuxt', 'Renamed')
    expect(readFileSync(join(rootDir, '.odx', 'cache', 'Catalog.edmx'), 'utf8')).toBe(servedXml)
    interrupted = false
    for (const invalidXml of ['<edmx:Edmx>', '<html><body>Edmx service is unavailable</body></html>', '<Edmx xmlns="urn:not-odata"/>']) {
      malformedXml = invalidXml
      const failure = await prepare('.nuxt').then(() => undefined, error => error)
      for (const cachePath of [
        join(rootDir, '.nuxt', 'odx', 'temp', 'Catalog.edmx'),
        join(rootDir, '.odx', 'cache', 'Catalog.edmx'),
      ]) {
        expect(readFileSync(cachePath, 'utf8')).toBe(servedXml)
      }
      expect(failure).toMatchObject({ message: expect.stringContaining('Could not parse OData metadata') })
    }
    malformedXml = undefined
    available = false
    await prepare('.nuxt-offline', 'Renamed')
    expect(requests).toEqual(Array.from({ length: 9 }).fill('GET /odata/$metadata?sap-client=100&sap-language=DE'))
  }
  finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
      server.closeAllConnections()
    })
    rmSync(rootDir, { recursive: true, force: true })
  }
}, 60_000)
