import { env } from '@typebot.io/env'
import { initClient } from './initClient'
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob'

// Função para sanitizar o arquivo (apenas o nome, preservando os diretórios)
const sanitizeKey = (key: string): string => {
  const parts = key.split('/')
  const fileName = parts.pop() as string
  const safeFileName = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
  parts.push(safeFileName)
  return parts.join('/')
}

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
  const safeKey = sanitizeKey(key)
  if (env.AZURE_STORAGE_CONNECTION_STRING && env.AZURE_CONTAINER_NAME) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      env.AZURE_STORAGE_CONNECTION_STRING
    )
    const containerClient = blobServiceClient.getContainerClient(
      env.AZURE_CONTAINER_NAME
    )
    const blockBlobClient = containerClient.getBlockBlobClient(
      'public/' + safeKey
    )

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
        blobCacheControl: 'public, max-age=86400',
      },
    })

    return `${env.AZURE_BLOB_PUBLIC_ENDPOINT}/public/${safeKey}`
  } else {
    const minioClient = initClient()

    await minioClient.putObject(env.S3_BUCKET, 'public/' + safeKey, file, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
    })

    return env.S3_PUBLIC_CUSTOM_DOMAIN
      ? `${env.S3_PUBLIC_CUSTOM_DOMAIN}/public/${safeKey}`
      : `http${env.S3_SSL ? 's' : ''}://${env.S3_ENDPOINT}${
          env.S3_PORT ? `:${env.S3_PORT}` : ''
        }/${env.S3_BUCKET}/public/${safeKey}`
  }
}
