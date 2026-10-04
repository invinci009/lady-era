import 'server-only'
import { getAdminStorage } from './admin'

// ==============================================================================
// Firebase Storage Helpers
// ==============================================================================
// Server-side storage operations for branding assets, QR codes, etc.
// ==============================================================================

/**
 * Upload a file to Firebase Storage.
 */
export async function uploadFile(
  path: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const bucket = getAdminStorage().bucket()
  const file = bucket.file(path)

  await file.save(data, {
    metadata: {
      contentType,
    },
  })

  // Make the file publicly readable
  await file.makePublic()

  return `https://storage.googleapis.com/${bucket.name}/${path}`
}

/**
 * Delete a file from Firebase Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const bucket = getAdminStorage().bucket()
  const file = bucket.file(path)
  await file.delete()
}

/**
 * Check if a file exists in Firebase Storage.
 */
export async function fileExists(path: string): Promise<boolean> {
  const bucket = getAdminStorage().bucket()
  const file = bucket.file(path)
  const [exists] = await file.exists()
  return exists
}

/**
 * Get a public URL for a file.
 */
export function getPublicUrl(path: string): string {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  return `https://storage.googleapis.com/${bucketName}/${path}`
}

/**
 * Generate a signed URL for temporary access.
 */
export async function getSignedUrl(path: string, expiresInMinutes = 60): Promise<string> {
  const bucket = getAdminStorage().bucket()
  const file = bucket.file(path)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  })
  return url
}
