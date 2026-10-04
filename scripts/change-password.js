#!/usr/bin/env node
/**
 * PM Zaika Restaurant - Change Admin Password CLI Script (Firebase)
 *
 * Usage:
 *   node scripts/change-password.js <newPassword> [usernameOrEmail]
 *   npm run change-password <newPassword> [usernameOrEmail]
 *
 * Examples:
 *   npm run change-password MyNewSecretPass123
 *   npm run change-password MyNewSecretPass123 admin
 *   npm run change-password MyNewSecretPass123 invincibleperson9@gmail.com
 */

const fs = require('fs')
const path = require('path')

const PRIMARY_EMAIL = 'invincibleperson9@gmail.com'
const ALIASES = new Set([
  'admin',
  'owner',
  'zaika',
  'pmzaika',
  'pm-zaika',
  'admin@pmzaika.com',
  'owner@pmzaika.com',
  'admin@pm-zaika.com',
  'owner@pm-zaika.com',
  'pmzaika@gmail.com',
  'pmzaikapatna@gmail.com',
  'biryani',
  'charminar',
])

function resolveEmail(input) {
  if (!input) return PRIMARY_EMAIL
  const clean = input.trim().toLowerCase()
  if (ALIASES.has(clean)) return PRIMARY_EMAIL
  return input.trim()
}

// 1. Validate arguments
const newPassword = process.argv[2]
const userInput = process.argv[3] || 'admin'
const targetEmail = resolveEmail(userInput)

if (!newPassword || newPassword.length < 8) {
  console.error('\n❌ Error: Password is required and must be at least 8 characters long.')
  console.log('\nUsage:')
  console.log('   npm run change-password <newPassword> [usernameOrEmail]')
  console.log('\nExample:')
  console.log('   npm run change-password SecurePass@2026 admin\n')
  process.exit(1)
}

// 2. Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (!fs.existsSync(envPath)) {
  console.error('\n❌ Error: .env.local file was not found in project root.\n')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

const serviceAccountRaw = getEnv('FIREBASE_SERVICE_ACCOUNT_KEY')

if (!serviceAccountRaw) {
  console.error('\n❌ Error: FIREBASE_SERVICE_ACCOUNT_KEY missing in .env.local\n')
  process.exit(1)
}

let serviceAccount
try {
  serviceAccount = JSON.parse(serviceAccountRaw)
} catch {
  try {
    serviceAccount = JSON.parse(Buffer.from(serviceAccountRaw, 'base64').toString('utf-8'))
  } catch {
    console.error('\n❌ Error: FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON or base64.\n')
    process.exit(1)
  }
}

// 3. Initialize Firebase Admin
const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth()

async function run() {
  console.log('\n======================================================')
  console.log('   PM Zaika Restaurant — Change Password CLI (Firebase)')
  console.log('======================================================')
  console.log(`Target User: ${targetEmail} (input: "${userInput}")`)

  let user
  try {
    user = await auth.getUserByEmail(targetEmail)
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/configuration-not-found') {
      console.error(`\n❌ User "${targetEmail}" not found.`)
      console.error('Make sure Firebase Authentication with Email/Password provider is enabled,')
      console.error('then run: npm run firebase:seed\n')
      process.exit(1)
    }
    throw err
  }

  await auth.updateUser(user.uid, { password: newPassword })

  console.log('\n✅ SUCCESS: Password updated successfully!')
  console.log('------------------------------------------------------')
  console.log(`User Email : ${user.email}`)
  console.log(`User ID    : ${user.uid}`)
  console.log('------------------------------------------------------')
  console.log('You can now log in at:')
  console.log('  Local:      http://localhost:3000/login')
  console.log('  Production: https://pmzaikaqr.vercel.app/login')
  console.log('  Username:   admin (or ' + user.email + ')\n')
}

run().catch((err) => {
  console.error('\n❌ Failed to update password:', err.message)
  process.exit(1)
})
