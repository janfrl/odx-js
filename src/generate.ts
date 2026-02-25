import { generate } from '@sap-cloud-sdk/generator'

interface GenerateODataParams {
  input: string
  outputDir: string
}

export async function generateODataClient({ input, outputDir }: GenerateODataParams): Promise<void> {
  await generate({
    input,
    outputDir,
    overwrite: true,
    clearOutputDir: true,
    packageJson: true,
    transpile: false,
  })
}
