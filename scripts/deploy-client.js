#!/usr/bin/env node

/**
 * ReviewPulse — Client Deployment Script
 * 
 * Validates configuration, builds, and deploys the client application.
 * Run with: node scripts/deploy-client.js
 */

const { execSync } = require('child_process')
const path = require('path')

// ==============================================================================
// Deployment Pipeline
// ==============================================================================

const steps = [
  {
    name: 'Validate client configuration',
    command: 'node scripts/validate-client.js',
  },
  {
    name: 'Run type checking',
    command: 'npx tsc --noEmit',
  },
  {
    name: 'Run linting',
    command: 'npm run lint',
  },
  {
    name: 'Build application',
    command: 'npm run build',
  },
]

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║  ReviewPulse — Client Deployment Pipeline                  ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

let currentStep = 0

for (const step of steps) {
  currentStep++
  console.log(`\n[${currentStep}/${steps.length}] ${step.name}...`)
  console.log(`${'─'.repeat(62)}`)

  try {
    execSync(step.command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log(`\n✓ ${step.name} completed successfully.`)
  } catch (error) {
    console.error(`\n✗ ${step.name} failed.`)
    console.error('\nDeployment aborted.\n')
    process.exit(1)
  }
}

console.log(`\n${'═'.repeat(62)}`)
console.log('\n✓ Deployment completed successfully!\n')
console.log('Your ReviewPulse application is ready.')
console.log('\nNext steps:')
console.log('  1. Deploy to your hosting provider (Vercel, Firebase Hosting, etc.)')
console.log('  2. Set up your Firebase project with the provided security rules')
console.log('  3. Generate QR codes for your campaigns')
console.log('  4. Test the customer flow end-to-end\n')
