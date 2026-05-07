interface NitroE2ETestConfig {
  nitro: {
    inlineDynamicImports: true
    preset: 'node-server'
    externals: {
      traceOptions: {
        ignore: (path: string) => boolean
      }
    }
  }
}

const WINDOWS_PATH_SEPARATOR_RE = /\\/g

function isOptionalFseventsDependency(path: string): boolean {
  return path.replace(WINDOWS_PATH_SEPARATOR_RE, '/').includes('/node_modules/fsevents')
}

export function createNitroE2ETestConfig(): NitroE2ETestConfig {
  return {
    nitro: {
      // Node 24 rejects Nitro's file:///_entry.js placeholder in split chunks.
      inlineDynamicImports: true,
      preset: 'node-server',
      externals: {
        traceOptions: {
          // pnpm does not install chokidar's optional macOS fsevents package on Windows.
          ignore: isOptionalFseventsDependency,
        },
      },
    },
  }
}
