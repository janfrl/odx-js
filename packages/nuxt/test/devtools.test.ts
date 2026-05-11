import { existsSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEVTOOLS_UI_LOCAL_PORT, DEVTOOLS_UI_ROUTE, setupDevToolsUI } from '../src/devtools'

const { startSubprocess } = vi.hoisted(() => ({
  startSubprocess: vi.fn(),
}))

vi.mock('@nuxt/devtools-kit', () => ({
  startSubprocess,
}))

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: vi.fn(),
  }
})

function createNuxtHarness() {
  type NuxtHookCallback = (payload?: unknown) => void
  const hooks = new Map<string, NuxtHookCallback[]>()
  const nuxt = {
    options: {
      nitro: {},
    },
    hook: vi.fn((name: string, callback: NuxtHookCallback) => {
      hooks.set(name, [...(hooks.get(name) || []), callback])
    }),
  } as any

  return {
    nuxt,
    callHook(name: string, payload?: unknown) {
      for (const callback of hooks.get(name) || [])
        callback(payload)
    },
  }
}

describe('devtools UI integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defers the explorer dev server until Vite is serving', () => {
    vi.mocked(existsSync).mockImplementation(path => path === '/repo/packages/explorer')

    const resolver = {
      resolve: vi.fn((path: string) => {
        if (path === './client')
          return '/repo/packages/nuxt/client'
        if (path === '../../explorer')
          return '/repo/packages/explorer'
        return path
      }),
    } as any
    const { nuxt, callHook } = createNuxtHarness()

    setupDevToolsUI(nuxt, resolver)

    expect(startSubprocess).not.toHaveBeenCalled()
    const middlewareUse = vi.fn()
    callHook('vite:serverCreated', { middlewares: { use: middlewareUse } })
    expect(middlewareUse).toHaveBeenCalledWith(DEVTOOLS_UI_ROUTE, expect.any(Function))

    expect(startSubprocess).toHaveBeenCalledTimes(1)
    expect(startSubprocess).toHaveBeenCalledWith(
      {
        command: 'pnpm',
        args: ['exec', 'nuxi', 'dev', '--host', 'localhost', '--port', DEVTOOLS_UI_LOCAL_PORT.toString()],
        cwd: '/repo/packages/explorer',
        env: {
          ODX_EXPLORER_API_PROXY_TARGET: 'http://localhost:3000',
        },
      },
      {
        id: 'odx:client',
        name: 'ODX Explorer Dev',
      },
    )
  })
})
