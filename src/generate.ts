import { generate } from '@sap-cloud-sdk/generator'

interface GenerateODataParams {
  input: string
  outputDir: string
}

export async function generateODataClient({ input, outputDir }: GenerateODataParams) {
  await generate({
    input,
    outputDir,
    overwrite: true,
    clearOutputDir: true,
    packageJson: false,
    transpile: false,
  })
}
