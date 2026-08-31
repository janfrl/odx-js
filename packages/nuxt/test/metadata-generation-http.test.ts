import type { Nuxt } from '@nuxt/schema'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { setupTypeGeneration } from '../src/generate'

it('fails fresh preparation on HTTP failure and preserves a valid SDK cache across malformed downloads and outages', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'odx-metadata-http-'))
  const xml = readFileSync(fileURLToPath(new URL('../playground/minimal/edmx/minimal.edmx', import.meta.url)), 'utf8')
  let available = false
  let malformed = false
  const requests: string[] = []
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`)
    response.writeHead(available ? 200 : 503, { 'content-type': 'application/xml' })
    response.end(available ? malformed ? '<edmx:Edmx>' : xml : 'Unavailable')
  })

  try {
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Expected a loopback TCP server')
    const serviceUrl = `http://127.0.0.1:${address.port}/odata`

    async function prepare(buildName: string) {
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
        services: [{ name: 'Catalog', url: serviceUrl }],
      })
      if (!prepareTypes)
        throw new Error('Missing type preparation hook')
      const references: { path: string }[] = []
      await prepareTypes({ references })
      expect(references).toEqual([{ path: join(buildDir, 'odx-types', 'index.d.ts').replaceAll('\\', '/') }])
      expect(readFileSync(join(buildDir, 'odx-types', 'index.d.ts'), 'utf8'))
        .toContain('Catalog: ODataRuntimeService<"Products", { "Products": CatalogModels.Product }>')
      expect(readdirSync(join(buildDir, 'odx-types', 'Catalog'))).toContain('MinimalLocalModel.ts')
    }

    await expect(prepare('.nuxt')).rejects.toMatchObject({
      message: 'Could not download metadata for Catalog and no cached metadata is available.',
      cause: { message: 'Status: 503' },
    })
    expect(existsSync(join(rootDir, '.nuxt', 'odx-types', 'index.d.ts'))).toBe(false)

    available = true
    await prepare('.nuxt')
    malformed = true
    await expect(prepare('.nuxt')).rejects.toThrow('Could not parse OData metadata')
    for (const cachePath of [
      join(rootDir, '.nuxt', 'odx', 'temp', 'Catalog.edmx'),
      join(rootDir, '.odx', 'cache', 'Catalog.edmx'),
    ]) {
      expect(readFileSync(cachePath, 'utf8')).toBe(xml)
    }
    available = false
    await prepare('.nuxt-offline')
    expect(requests).toEqual(Array.from({ length: 4 }).fill('GET /odata/$metadata'))
  }
  finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
      server.closeAllConnections()
    })
    rmSync(rootDir, { recursive: true, force: true })
  }
}, 60_000)
