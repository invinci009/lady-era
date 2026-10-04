#!/usr/bin/env node

/**
 * ReviewPulse — Firebase Seed Script
 * 
 * Seeds initial data into Firestore for a new client deployment.
 * Run with: node scripts/seed-firebase.js
 * 
 * Requires: FIREBASE_SERVICE_ACCOUNT_KEY environment variable
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

// ==============================================================================
// Load Config
// ==============================================================================

const configPath = path.join(process.cwd(), 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('ERROR: config.json not found. Copy templates/client-config.example.json to config.json first.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// ==============================================================================
// Initialize Firebase Admin
// ==============================================================================

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountRaw) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountRaw);
} catch {
  try {
    serviceAccount = JSON.parse(Buffer.from(serviceAccountRaw, 'base64').toString('utf-8'));
  } catch {
    console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON or base64.');
    process.exit(1);
  }
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

// ==============================================================================
// Seed Functions
// ==============================================================================

async function seedRestaurantSettings() {
  console.log('Seeding restaurant settings...');
  
  const docRef = db.collection('restaurant').doc('settings');
  const now = new Date().toISOString();
  
  await docRef.set({
    name: config.name,
    slug: config.slug,
    contact: config.contact || {},
    location: config.location || {},
    google: config.google,
    branding: config.branding,
    features: config.features,
    settings: config.settings,
    welcomeMessage: config.welcomeMessage,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  
  console.log('  ✓ Restaurant settings saved');
}

async function seedQuestions() {
  console.log('Seeding quiz questions...');
  
  const questions = [
    {
      key: 'overall_rating',
      type: 'rating',
      text: { en: 'How was your overall dining experience?' },
      required: true,
      position: 1,
      active: true,
    },
    {
      key: 'food_rating',
      type: 'rating',
      text: { en: 'How did you find the food & flavors?' },
      required: true,
      position: 2,
      active: true,
    },
    {
      key: 'service_rating',
      type: 'rating',
      text: { en: 'How was the service & hospitality?' },
      required: true,
      position: 3,
      active: true,
    },
    {
      key: 'liked',
      type: 'multi_choice',
      text: { en: 'What did you enjoy most today?' },
      config: {
        options: ['food', 'service', 'ambience', 'portion_size', 'presentation', 'value'],
      },
      required: false,
      position: 4,
      active: true,
    },
    {
      key: 'ordered',
      type: 'multi_choice',
      text: { en: 'Which dishes did you order today?' },
      config: {
        options: [], // Will be populated from menu items
      },
      required: false,
      position: 5,
      active: true,
    },
    {
      key: 'comment',
      type: 'text',
      text: { en: 'Any special message for our chefs?' },
      required: false,
      position: 6,
      active: true,
    },
    {
      key: 'return_intent',
      type: 'single_choice',
      text: { en: `Would you visit ${config.name} again?` },
      config: {
        options: ['definitely', 'probably', 'maybe', 'probably_not'],
      },
      required: false,
      position: 7,
      active: true,
    },
  ];
  
  for (const q of questions) {
    const docRef = db.collection('questions').doc(q.key);
    await docRef.set({
      ...q,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  }
  
  console.log(`  ✓ ${questions.length} questions saved`);
}

async function seedCampaigns() {
  console.log('Seeding campaigns...');
  
  const campaigns = [
    {
      name: 'Table Stands - Dine-In QR',
      slug: config.slug,
      active: true,
    },
    {
      name: 'Main Dining Hall Stand',
      slug: `${config.slug}-main`,
      active: true,
    },
  ];
  
  for (const c of campaigns) {
    const docRef = db.collection('campaigns').doc();
    await docRef.set({
      ...c,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  console.log(`  ✓ ${campaigns.length} campaigns saved`);
}

async function seedMenuItems() {
  console.log('Seeding menu items...');
  
  // Default menu items — client should customize these
  const defaultMenu = [
    'Special Biryani',
    'Chicken Dum Biryani',
    'Mutton Korma',
    'Chicken Tikka Butter Masala',
    'Paneer Butter Masala',
    'Butter Naan & Rumali Roti',
  ];
  
  for (let i = 0; i < defaultMenu.length; i++) {
    const docRef = db.collection('menuItems').doc();
    await docRef.set({
      name: { en: defaultMenu[i] },
      active: true,
      position: i + 1,
      createdAt: new Date().toISOString(),
    });
  }
  
  console.log(`  ✓ ${defaultMenu.length} menu items saved`);
}

async function createOwnerUser() {
  console.log('Creating owner user...');
  
  const adminEmail = config.contact?.email;
  if (!adminEmail) {
    console.log('  ⚠ No admin email in config, skipping user creation');
    return;
  }
  
  try {
    const user = await auth.getUserByEmail(adminEmail);
    console.log(`  ✓ Owner user already exists: ${adminEmail}`);
  } catch {
    try {
      await auth.createUser({
        email: adminEmail,
        password: 'changeme123', // User should change this immediately
        emailVerified: false,
      });
      console.log(`  ✓ Owner user created: ${adminEmail}`);
      console.log('  ⚠ Default password: changeme123 (user must change this)');
    } catch (err) {
      console.error(`  ✗ Failed to create owner user: ${err.message}`);
    }
  }
}

// ==============================================================================
// Main
// ==============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ReviewPulse — Firebase Seed Script                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Seeding data for: ${config.name}\n`);
  
  try {
    await seedRestaurantSettings();
    await seedQuestions();
    await seedCampaigns();
    await seedMenuItems();
    await createOwnerUser();
    
    console.log('\n✓ Seeding completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Customize menu items in Firebase Console');
    console.log('  2. Set up your Google review URL in config.json');
    console.log('  3. Deploy your application\n');
  } catch (error) {
    console.error('\n✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

main();
