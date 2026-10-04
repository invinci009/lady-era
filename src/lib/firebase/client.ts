'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// ==============================================================================
// Firebase Client-Side Initialization
// ==============================================================================
// Singleton pattern to prevent duplicate initialization during Next.js
// hot reload in development.
// ==============================================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

/**
 * Initialize Firebase client (singleton).
 * Safe to call multiple times — returns existing instance.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApp()
  }
  return app
}

/**
 * Get Firebase Auth instance.
 */
export function getFirebaseAuth(): Auth {
  getFirebaseApp()
  if (!auth) {
    auth = getAuth(app)
  }
  return auth
}

/**
 * Get Firestore instance.
 */
export function getFirestoreDb(): Firestore {
  getFirebaseApp()
  if (!db) {
    db = getFirestore(app)
  }
  return db
}

/**
 * Get Firebase Storage instance.
 */
export function getFirebaseStorage(): FirebaseStorage {
  getFirebaseApp()
  if (!storage) {
    storage = getStorage(app)
  }
  return storage
}

/**
 * Check if Firebase is properly configured.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  )
}
