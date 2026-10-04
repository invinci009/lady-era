# ReviewPulse — Client Onboarding Guide

This guide walks through the process of creating a new client deployment from the master template.

## Prerequisites

- Firebase account with billing enabled
- Node.js 20+ installed
- Git installed
- Access to the master template repository

## Step 1: Duplicate the Template

```bash
# Clone the master template
git clone <template-repo-url> reviewpulse-<client-name>
cd reviewpulse-<client-name>

# Remove the .git directory (this is a new client repo)
rm -rf .git
git init
git add .
git commit -m "Initial commit from ReviewPulse template"
```

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project**
3. Enter the restaurant name as the project name
4. Enable Google Analytics (optional)
5. Create the project

## Step 3: Configure Firebase Services

### Authentication
1. Go to **Authentication** → **Get Started**
2. Enable **Email/Password** provider
3. Add the owner's email as a user

### Firestore
1. Go to **Firestore Database** → **Create Database**
2. Start in **production mode**
3. Choose a location close to the restaurant

### Storage
1. Go to **Storage** → **Get Started**
2. Start in **production mode**

### App Check (Optional but Recommended)
1. Go to **App Check** → **Register**
2. Enable reCAPTCHA v3 for web

## Step 4: Get Firebase Configuration

### Client-Safe Config
1. Go to **Project Settings** → **General**
2. Under **Your apps**, add a Web app
3. Copy the config values to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Server-Side Config
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Copy the JSON content to `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## Step 5: Configure Restaurant

1. Copy the example config:
   ```bash
   cp templates/client-config.example.json config.json
   ```

2. Edit `config.json` with the restaurant's details:

```json
{
  "name": "Restaurant Name",
  "slug": "restaurant-slug",
  "contact": {
    "phone": "+91XXXXXXXXXX",
    "email": "contact@restaurant.com"
  },
  "location": {
    "address": "123 Main Street",
    "city": "City",
    "state": "State",
    "country": "Country"
  },
  "google": {
    "reviewUrl": "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID"
  },
  "branding": {
    "primaryColor": "#d97706",
    "secondaryColor": "#1e293b",
    "accentColor": "#f59e0b"
  },
  "features": {
    "aiReviews": true,
    "privateFeedback": true,
    "crm": true,
    "campaignAnalytics": true,
    "menuManagement": true
  }
}
```

## Step 6: Add Branding Assets

1. Upload the restaurant logo to Firebase Storage:
   ```bash
   firebase storage:cp logo.png gs://<project-id>.appspot.com/branding/logo.png
   ```

2. Make the file publicly readable:
   ```bash
   firebase storage:make-public gs://<project-id>.appspot.com/branding/logo.png
   ```

3. Update `config.json` with the public URL:
   ```json
   {
     "branding": {
       "logoUrl": "https://storage.googleapis.com/<project-id>.appspot.com/branding/logo.png"
     }
   }
   ```

## Step 7: Configure Menu Items

Add menu items to Firestore for the "What did you order?" question:

```bash
# Use the Firebase Console or add via the dashboard
# Collection: menuItems
# Document fields:
#   - name: { "en": "Dish Name" }
#   - active: true
#   - position: 1
```

## Step 8: Deploy Firebase Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

## Step 9: Validate and Build

```bash
# Validate configuration
npm run client:validate

# Build for production
npm run client:build
```

## Step 10: Deploy Application

### Option A: Vercel
1. Push the repository to GitHub/GitLab
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option B: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
```

### Option C: Self-Hosted
```bash
npm run build
npm start
```

## Step 11: Generate QR Codes

1. Go to the dashboard
2. Navigate to **Campaigns**
3. Create a new campaign
4. Download the QR code
5. Print and place at tables

## Step 12: Test End-to-End

1. Scan the QR code with a phone
2. Complete the 5-question quiz
3. Verify the AI review draft is generated
4. Edit the review text
5. Click "Leave a Review on Google"
6. Verify the Google review page opens
7. Check the dashboard for the new session

## Troubleshooting

### Firebase Auth not working
- Verify Email/Password provider is enabled
- Check that the user email exists in Authentication → Users

### Firestore permission denied
- Verify Firestore rules are deployed
- Check that the service account key is valid

### AI review not generated
- Verify ANTHROPIC_API_KEY is set in .env.local
- Check that the key has sufficient credits
- The app will fall back to deterministic generation if AI fails

### QR code not working
- Verify the campaign slug is correct
- Check that the campaign is active
- Verify NEXT_PUBLIC_APP_URL is set correctly
