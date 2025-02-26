import { env } from '@typebot.io/env'
import { initClient } from './initClient'
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'

type Props = {
  key: string
  file: Buffer
  mimeType: string
}

export const uploadFileToBucket = async ({
  key,
  file,
  mimeType,
}: Props): Promise<string> => {
  if (env.AZURE_STORAGE_CONNECTION_STRING && env.AZURE_CONTAINER_NAME) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      env.AZURE_STORAGE_CONNECTION_STRING
    )
    const containerClient = blobServiceClient.getContainerClient(
      env.AZURE_CONTAINER_NAME
    )
    const blockBlobClient = containerClient.getBlockBlobClient('public/' + key)

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
        blobCacheControl: 'public, max-age=86400',
      },
    })

    return `${env.AZURE_BLOB_PUBLIC_ENDPOINT}/public/${key}`
  } else {
    const minioClient = initClient()

    await minioClient.putObject(env.S3_BUCKET, 'public/' + key, file, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
    })

    return env.S3_PUBLIC_CUSTOM_DOMAIN
      ? `${env.S3_PUBLIC_CUSTOM_DOMAIN}/public/${key}`
      : `http${env.S3_SSL ? 's' : ''}://${env.S3_ENDPOINT}${
          env.S3_PORT ? `:${env.S3_PORT}` : ''
        }/${env.S3_BUCKET}/public/${key}`
  }
}
