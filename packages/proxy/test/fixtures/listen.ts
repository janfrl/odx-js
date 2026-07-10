import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export async function listenOnLoopback(server: Server): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })

  const address = server.address() as AddressInfo | null
  if (!address)
    throw new Error('Test server did not expose a listening address')

  return `http://127.0.0.1:${address.port}`
}
