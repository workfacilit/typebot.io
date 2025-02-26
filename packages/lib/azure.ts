import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
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

interface GenerateSasUrlOptions {
  expiresOn: Date
  permissions: import('@azure/storage-blob').BlobSASPermissions
}

export const generateSasUrl = async (
  containerClient: import('@azure/storage-blob').ContainerClient,
  filePath: string
): Promise<string> => {
  const blobClient = containerClient.getBlockBlobClient(filePath)
  const permissions = new BlobSASPermissions()
  permissions.write = true
  permissions.read = true
  permissions.create = true
  permissions.delete = true

  const options: GenerateSasUrlOptions = {
    expiresOn: new Date(new Date().valueOf() + 86400 * 1000), // 1 day from now
    permissions,
  }

  const sasToken = await blobClient.generateSasUrl(options)
  return sasToken
}
