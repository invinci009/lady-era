#!/usr/bin/env node

/**
 * ReviewPulse — Client Configuration Validator
 * 
 * Validates that a client repository is properly configured before deployment.
 * Run with: node scripts/validate-client.js
 */

const fs = require('fs')
const path = require('path')

// ==============================================================================
// Validation Rules
// ==============================================================================

const validations = []

function addValidation(name, check, errorMessage) {
  validations.push({ name, check, errorMessage })
}

// ==============================================================================
// 1. Config File Validation
// ==============================================================================

addValidation(
  'Config file exists',
  () => fs.existsSync(path.join(process.cwd(), 'config.json')),
  'config.json is missing. Copy templates/client-config.example.json to config.json and fill in your restaurant details.'
)

const configPath = path.join(process.cwd(), 'config.json')
let config = null

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch (e) {
    console.error('ERROR: config.json is not valid JSON')
    process.exit(1)
  }

  addValidation(
    'Restaurant name is set',
    () => config.name && config.name.length > 0 && config.name !== 'Your Restaurant Name',
    'Restaurant name is missing or still has the default value.'
  )

  addValidation(
    'Restaurant slug is valid',
    () => config.slug && /^[a-z0-9-]+$/.test(config.slug) && config.slug !== 'your-restaurant-slug',
    'Restaurant slug is missing, invalid, or still has the default value.'
  )

  addValidation(
    'Google review URL is set',
    () => config.google?.reviewUrl && !config.google.reviewUrl.includes('YOUR_PLACE_ID'),
    'Google review URL is missing or still has the placeholder value. Get your URL from Google Business Profile.'
  )

  addValidation(
    'Google review URL is valid',
    () => {
      try {
        const url = new URL(config.google?.reviewUrl || '')
        const allowed = ['google.com', 'www.google.com', 'search.google.com', 'g.page', 'maps.app.goo.gl', 'goo.gl']
        return url.protocol === 'https:' && allowed.some(a => url.hostname === a || url.hostname.endsWith('.' + a))
      } catch { return false }
    },
    'Google review URL must be a valid https URL from Google (google.com, g.page, maps.app.goo.gl, etc.)'
  )

  addValidation(
    'Branding primary color is valid',
    () => config.branding?.primaryColor && /^#[0-9a-fA-F]{6}$/.test(config.branding.primaryColor),
    'Branding primary color must be a valid hex color (e.g. #d97706).'
  )

  addValidation(
    'Branding secondary color is valid',
    () => config.branding?.secondaryColor && /^#[0-9a-fA-F]{6}$/.test(config.branding.secondaryColor),
    'Branding secondary color must be a valid hex color (e.g. #1e293b).'
  )

  addValidation(
    'At least one feature is enabled',
    () => config.features && Object.values(config.features).some(v => v === true),
    'At least one feature must be enabled in config.json.'
  )

  addValidation(
    'Default language is set',
    () => config.settings?.defaultLanguage && config.settings.defaultLanguage.length > 0,
    'Default language must be set in config.json.'
  )
}

// ==============================================================================
// 2. Environment Variable Validation
// ==============================================================================

const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), '.env.example')

let envVars = {}
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) {
      envVars[match[1]] = match[2]
    }
  })
}

addValidation(
  '.env.local file exists',
  () => fs.existsSync(envPath),
  '.env.local is missing. Copy .env.example to .env.local and fill in your Firebase credentials.'
)

addValidation(
  'Firebase API key is set',
  () => envVars.NEXT_PUBLIC_FIREBASE_API_KEY && !envVars.NEXT_PUBLIC_FIREBASE_API_KEY.includes('your-'),
  'NEXT_PUBLIC_FIREBASE_API_KEY is missing or still has the placeholder value.'
)

addValidation(
  'Firebase auth domain is set',
  () => envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && !envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.includes('your-'),
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing or still has the placeholder value.'
)

addValidation(
  'Firebase project ID is set',
  () => envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes('your-'),
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing or still has the placeholder value.'
)

addValidation(
  'Firebase storage bucket is set',
  () => envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET && !envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.includes('your-'),
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is missing or still has the placeholder value.'
)

addValidation(
  'Firebase app ID is set',
  () => envVars.NEXT_PUBLIC_FIREBASE_APP_ID && !envVars.NEXT_PUBLIC_FIREBASE_APP_ID.includes('your-'),
  'NEXT_PUBLIC_FIREBASE_APP_ID is missing or still has the placeholder value.'
)

addValidation(
  'Firebase service account key is set',
  () => envVars.FIREBASE_SERVICE_ACCOUNT_KEY && !envVars.FIREBASE_SERVICE_ACCOUNT_KEY.includes('...'),
  'FIREBASE_SERVICE_ACCOUNT_KEY is missing. Generate a service account key from Firebase Console.'
)

addValidation(
  'Session cookie secret is set',
  () => envVars.SESSION_COOKIE_SECRET && envVars.SESSION_COOKIE_SECRET.length >= 32,
  'SESSION_COOKIE_SECRET must be at least 32 characters long.'
)

addValidation(
  'Hash salt is set',
  () => envVars.HASH_SALT && envVars.HASH_SALT.length >= 32,
  'HASH_SALT must be at least 32 characters long.'
)

// ==============================================================================
// 3. Security Validation
// ==============================================================================

addValidation(
  'Anthropic API key is NOT in NEXT_PUBLIC variables',
  () => !envVars.NEXT_PUBLIC_ANTHROPIC_API_KEY,
  'ANTHROPIC_API_KEY must NOT be prefixed with NEXT_PUBLIC_. It is a server-side secret.'
)

addValidation(
  'Firebase service account key is NOT in NEXT_PUBLIC variables',
  () => !envVars.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY,
  'FIREBASE_SERVICE_ACCOUNT_KEY must NOT be prefixed with NEXT_PUBLIC_. It is a server-side secret.'
)

// ==============================================================================
// Run Validations
// ==============================================================================

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║  ReviewPulse — Client Configuration Validator              ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

let passed = 0
let failed = 0
const errors = []

for (const validation of validations) {
  const result = validation.check()
  if (result) {
    console.log(`  ✓ ${validation.name}`)
    passed++
  } else {
    console.log(`  ✗ ${validation.name}`)
    console.log(`    → ${validation.errorMessage}`)
    failed++
    errors.push(validation.errorMessage)
  }
}

console.log(`\n${'─'.repeat(62)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`${'─'.repeat(62)}\n`)

if (failed > 0) {
  console.log('ERROR: Configuration validation failed.\n')
  console.log('Please fix the following issues before deploying:\n')
  errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`))
  console.log('\nDeployment aborted.\n')
  process.exit(1)
} else {
  console.log('SUCCESS: All validations passed. Ready to deploy.\n')
  process.exit(0)
}
