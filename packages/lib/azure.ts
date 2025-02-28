import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  BlobSASSignatureValues,
} from '@azure/storage-blob'
import { env } from '@typebot.io/env'

export const getAzureContainerClient = () => {
  if (
    !env.AZURE_ACCOUNT_NAME ||
    !env.AZURE_ACCOUNT_KEY ||
    !env.AZURE_CONTAINER_NAME
  ) {
    throw new Error('Azure Storage configuration is missing.')
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    env.AZURE_ACCOUNT_NAME,
    env.AZURE_ACCOUNT_KEY
  )

  const blobServiceClient = new BlobServiceClient(
    `https://${env.AZURE_ACCOUNT_NAME}.blob.core.windows.net`,
    sharedKeyCredential
  )

  return blobServiceClient.getContainerClient(env.AZURE_CONTAINER_NAME)
}

interface SasOptions {
  expiresOn: Date
  permissions: BlobSASPermissions
  contentType: string
}

export const generateSasUrl = async (
  containerClient: ReturnType<BlobServiceClient['getContainerClient']>,
  filePath: string
): Promise<string> => {
  const sasOptions: BlobSASSignatureValues = {
    containerName: env.AZURE_CONTAINER_NAME as string,
    blobName: filePath,
    expiresOn: new Date(new Date().valueOf() + 86400 * 1000), // 24 hours
    permissions: BlobSASPermissions.parse('rcwd'), // read, create, write, delete
    contentType: 'BlockBlob',
  }

  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    new StorageSharedKeyCredential(
      env.AZURE_ACCOUNT_NAME as string,
      env.AZURE_ACCOUNT_KEY as string
    )
  ).toString()

  const blobClient = containerClient.getBlobClient(filePath)

  return `${blobClient.url}?${sasToken}`
}
