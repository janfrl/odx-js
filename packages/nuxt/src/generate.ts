import { execSync } from 'node:child_process'
import { consola } from 'consola'

const logger = consola.withTag('@bc8-odx/nuxt')

/**
 * Generates OData types using odata2ts.
 * Runs in 'models' mode to generate pure TypeScript interfaces.
 */
export async function generateODataTypes(xmlFilePath: string, outputDir: string, serviceName: string): Promise<void> {
  // Use pnpm odata2ts to use the locally installed version in the workspace
  // Note: Ensure @odata2ts/odata-service and odata2ts are installed in the workspace
  const command = `pnpm odata2ts --source ${xmlFilePath} --output ${outputDir} --mode models --emit-mode ts --prettier`

  try {
    // Pipe to capture output and avoid cluttering the terminal unless there's an error
    execSync(command, { stdio: 'pipe' })
    logger.success(`Generated SDK for ${serviceName}`)
  }
  catch (err: any) {
    const output = err.stdout?.toString() || err.stderr?.toString() || err.message
    logger.error(`Failed to generate SDK for ${serviceName}`)
    console.error(output)
    throw err
  }
}
