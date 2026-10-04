# ReviewPulse — Firebase + White-Label Template

A QR-powered restaurant customer-experience platform. Customers scan a QR code, complete a quick 5-question quiz, receive an optional AI-generated review draft (editable), and are handed off to the restaurant's Google review page.

## Architecture

This is a **single-client-per-deployment** template. Each restaurant gets:

- Its own Firebase project
- Its own Firestore database
- Its own Firebase Authentication
- Its own Firebase Storage
- Its own environment configuration
- Its own deployment

```
MASTER TEMPLATE REPOSITORY
         │
         │ duplicate
         ▼
  CLIENT REPOSITORY
         │
   ┌─────┴────────┐
   ↓              ↓
Client Config   Firebase Env
   │              │
   └──────┬───────┘
          ↓
     CLIENT BUILD
          ↓
      DEPLOYMENT
```

## Quick Start

### 1. Clone and Configure

```bash
# Clone this template
git clone <template-repo> my-restaurant
cd my-restaurant

# Copy environment variables
cp .env.example .env.local

# Copy client configuration
cp templates/client-config.example.json config.json
```

### 2. Set Up Firebase

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password provider)
3. Create a **Firestore** database
4. Enable **Storage**
5. Get your Firebase config from Project Settings → General
6. Generate a service account key from Project Settings → Service Accounts

### 3. Configure Environment Variables

Edit `.env.local`:

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin (Server-Side)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_COOKIE_SECRET=generate-a-random-32-char-string-here-32chars
HASH_SALT=generate-another-random-32-char-string-32ch

# Optional: AI Review Generation
ANTHROPIC_API_KEY=your-anthropic-key
```

### 4. Configure Restaurant

Edit `config.json`:

```json
{
  "name": "Your Restaurant Name",
  "slug": "your-restaurant-slug",
  "contact": {
    "phone": "+91XXXXXXXXXX",
    "email": "contact@yourrestaurant.com"
  },
  "location": {
    "address": "123 Main Street",
    "city": "Your City",
    "state": "Your State",
    "country": "Your Country"
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

### 5. Validate and Build

```bash
# Validate configuration
npm run client:validate

# Build for production
npm run client:build
```

### 6. Deploy

Deploy to your preferred hosting platform (Vercel, Firebase Hosting, etc.).

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Firebase emulators (optional)
npm run firebase:emulate
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, etc.)
│   │   ├── (dashboard)/        # Dashboard pages
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── business/       # Business settings endpoints
│   │   │   └── public/         # Public customer endpoints
│   │   ├── r/[slug]/           # Customer QR landing page
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── quiz/               # Customer quiz components
│   │   └── ...
│   ├── config/                 # Configuration system
│   │   ├── schema.ts           # Config schema (Zod)
│   │   ├── loader.ts           # Config loader
│   │   ├── branding.ts         # Branding tokens
│   │   └── features.ts         # Feature flags
│   ├── lib/                    # Utility libraries
│   │   ├── firebase/           # Firebase abstraction layer
│   │   ├── draft/              # AI review generation
│   │   ├── validation/         # Zod schemas
│   │   └── ...
│   └── proxy.ts                # Next.js 16 proxy (middleware)
├── firebase/                   # Firebase configuration
│   ├── firebase.json           # Firebase project config
│   ├── firestore.rules         # Firestore security rules
│   ├── storage.rules           # Storage security rules
│   └── functions/              # Cloud Functions
├── scripts/                    # Deployment scripts
│   ├── validate-client.js      # Config validation
│   └── deploy-client.js        # Deployment pipeline
├── templates/                  # Client templates
│   └── client-config.example.json
├── config.json                 # Restaurant configuration (per-client)
├── .env.example                # Environment variable template
└── package.json
```

## Client Onboarding Workflow

When onboarding a new restaurant client:

1. **Duplicate** this template repository
2. **Rename** the repository (e.g., `reviewpulse-my-restaurant`)
3. **Create** a new Firebase project for the client
4. **Replace** Firebase environment variables in `.env.local`
5. **Configure** restaurant details in `config.json`
6. **Add** branding assets (logo, favicon) to Firebase Storage
7. **Configure** menu items in Firestore
8. **Set** the Google review URL
9. **Validate** with `npm run client:validate`
10. **Build** with `npm run client:build`
11. **Deploy** to production
12. **Generate** QR codes for campaigns

## Compliance

ReviewPulse maintains strict review compliance:

- **CG-1:** Equal Google access for all customers
- **CG-2:** No rating-based routing
- **CG-3:** Zero incentives for reviews
- **CG-4:** Customer-owned review drafts
- **CG-5:** No content steering
- **CG-6:** Truthful polarity preservation
- **CG-7:** Anti-repetition (deterministic fallback)
- **CG-8:** No guilt or pressure tactics
- **CG-9:** Honest metrics
- **CG-10:** Unfiltered analytics

## License

Private — All rights reserved.
