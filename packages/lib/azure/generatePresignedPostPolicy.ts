import { getAzureContainerClient, generateSasUrl } from '../azure'
import { env } from '@typebot.io/env'

type AzurePostPolicyResult = {
  presignedUrl: string
  formData: Record<string, string>
}

type Props = {
  filePath: string
  fileType?: string
  maxFileSize?: number
}

export const generateAzurePresignedPostPolicy = async ({
  filePath,
  fileType,
  maxFileSize,
}: Props): Promise<AzurePostPolicyResult> => {
  const containerClient = getAzureContainerClient()
  const sasUrl = await generateSasUrl(containerClient, filePath)

  // Para Azure, não há formData extensivo como o S3,
  // mas podemos incluir informações padrão, se necessário.
  return {
    presignedUrl: sasUrl,
    formData: {
      'Cache-Control': 'public, max-age=86400',
      ...(fileType ? { 'Content-Type': fileType } : {}),
    },
  }
}
