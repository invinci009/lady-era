import 'server-only'
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage, type Storage } from 'firebase-admin/storage'

// ==============================================================================
// Firebase Admin Server-Side Initialization
// ==============================================================================
// Used in API routes and server components for privileged operations.
// Uses service account credentials from environment variables.
// ==============================================================================

let adminApp: App
let adminAuth: Auth
let adminDb: Firestore
let adminStorage: Storage

/**
 * Parse service account from environment variable.
 * Supports both JSON string and base64-encoded JSON.
 */
function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set')
  }

  try {
    // Try parsing as JSON first
    return JSON.parse(raw)
  } catch {
    // Try base64 decoding
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf-8')
      return JSON.parse(decoded)
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON or base64')
    }
  }
}

/**
 * Initialize Firebase Admin (singleton).
 */
export function getFirebaseAdminApp(): App {
  if (!getApps().length) {
    const serviceAccount = getServiceAccount()

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  }
  return getApps()[0]
}

/**
 * Get Firebase Admin Auth instance.
 */
export function getAdminAuth(): Auth {
  getFirebaseAdminApp()
  if (!adminAuth) {
    adminAuth = getAuth(adminApp)
  }
  return adminAuth
}

/**
 * Get Firestore Admin instance.
 */
export function getAdminFirestore(): Firestore {
  getFirebaseAdminApp()
  if (!adminDb) {
    adminDb = getFirestore(adminApp)
  }
  return adminDb
}

/**
 * Get Storage Admin instance.
 */
export function getAdminStorage(): Storage {
  getFirebaseAdminApp()
  if (!adminStorage) {
    adminStorage = getStorage(adminApp)
  }
  return adminStorage
}

/**
 * Verify a Firebase ID token and return the decoded token.
 * Use this to validate user sessions in API routes.
 */
export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth()
  return auth.verifyIdToken(idToken)
}

/**
 * Get user record by UID.
 */
export async function getUserByUid(uid: string) {
  const auth = getAdminAuth()
  return auth.getUser(uid)
}

/**
 * Check if Firebase Admin is properly configured.
 */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
}
