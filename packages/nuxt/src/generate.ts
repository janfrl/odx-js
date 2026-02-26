import { execSync } from 'node:child_process'

/**
 * Generates OData types using odata2ts.
 * Runs in 'models' mode to generate pure TypeScript interfaces.
 */
export async function generateODataTypes(xmlFilePath: string, outputDir: string, _serviceName: string): Promise<void> {
  const command = `npx odata2ts --source ${xmlFilePath} --output ${outputDir} --mode models --prettier`
  execSync(command, { stdio: 'inherit' })
}

/**
 * Compatibility wrapper for the proxy generation API.
 */
export async function generateODataClient({ input, outputDir }: { input: string, outputDir: string }): Promise<void> {
  return generateODataTypes(input, outputDir, '')
}
