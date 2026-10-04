import 'server-only'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

// ==============================================================================
// Server-Side Firebase *Client* SDK (for Route Handlers / Server Actions)
// ==============================================================================
// Route handlers cannot import from '@/lib/firebase/client' because that module
// has a 'use client' directive. The Firebase client SDK itself works fine in
// Node — it just needs an init module without the directive. This file is
// that module: sign-in, password-reset email, and password verification for
// server-side auth routes. Privileged operations still use firebase-admin.
// ==============================================================================

function getServerConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error(
      'Firebase client config missing (NEXT_PUBLIC_FIREBASE_*). Check .env.local.'
    )
  }

  return config
}

const SERVER_APP_NAME = 'server-auth'

/**
 * Get (or create) the server-side Firebase app instance.
 */
export function getServerFirebaseApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === SERVER_APP_NAME)
  if (existing) return existing
  return initializeApp(getServerConfig(), SERVER_APP_NAME)
}

let serverAuth: Auth | null = null

/**
 * Get Firebase Auth backed by the server-side app.
 * Do NOT read `.currentUser` here — verify identity via the
 * `firebase_token` cookie + firebase-admin instead.
 */
export function getServerAuth(): Auth {
  if (!serverAuth) {
    serverAuth = getAuth(getServerFirebaseApp())
  }
  return serverAuth
}
