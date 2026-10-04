# ReviewPulse — Firebase Setup Guide

This guide covers the Firebase project setup for a ReviewPulse deployment.

## Firebase Project Structure

```
reviewpulse-<client>/
├── Authentication (Email/Password)
├── Firestore Database
│   ├── restaurant/settings
│   ├── campaigns/{campaignId}
│   ├── menuItems/{itemId}
│   ├── questions/{questionId}
│   ├── sessions/{sessionId}
│   ├── answers/{answerId}
│   ├── reviewDrafts/{draftId}
│   ├── privateFeedback/{feedbackId}
│   ├── customers/{customerId}
│   ├── events/{eventId}
│   └── sessionFlags/{flagId}
├── Storage
│   ├── branding/ (logos, favicons)
│   ├── qr/ (generated QR codes)
│   └── menu/ (menu item images)
└── Cloud Functions (optional)
    ├── generateReviewDraft
    ├── aggregateAnalytics
    └── cleanupOldSessions
```

## Firestore Data Model

### Restaurant Settings
```
restaurant/settings
{
  name: string,
  slug: string,
  contact: { phone, helpline, email },
  location: { address, city, state, country },
  google: { reviewUrl },
  branding: { logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor },
  features: { aiReviews, privateFeedback, crm, campaignAnalytics, menuManagement },
  settings: { defaultLanguage, supportedLanguages, timezone },
  welcomeMessage: { en: "..." },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Campaigns
```
campaigns/{campaignId}
{
  name: string,
  slug: string,
  active: boolean,
  googleReviewUrlOverride: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Sessions
```
sessions/{sessionId}
{
  campaignId: string,
  status: "landed" | "in_progress" | "completed",
  language: string,
  deviceType: string | null,
  startedAt: timestamp | null,
  lastActivityAt: timestamp | null,
  completedAt: timestamp | null,
  ipHash: string | null,
  uaHash: string | null,
  createdAt: timestamp
}
```

### Answers
```
answers/{answerId}
{
  sessionId: string,
  questionKey: string,
  value: any,
  createdAt: timestamp
}
```

### Review Drafts
```
reviewDrafts/{draftId}
{
  sessionId: string,
  originalText: string,
  finalText: string,
  method: "llm" | "fallback",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Private Feedback
```
privateFeedback/{feedbackId}
{
  sessionId: string,
  category: string,
  message: string,
  contactName: string | null,
  contactValue: string | null,
  contactConsent: boolean,
  createdAt: timestamp
}
```

### Events
```
events/{eventId}
{
  sessionId: string,
  campaignId: string | null,
  eventType: string,
  clientEventId: string | null,
  metadata: { ... },
  timestamp: timestamp,
  createdAt: timestamp
}
```

## Security Rules

The Firestore security rules implement a **single-restaurant model**:

- **Public read:** Settings, campaigns, menu items, questions (needed for customer flow)
- **Public create:** Sessions, answers, review drafts, private feedback, events (customer submissions)
- **Admin only:** All reads of sensitive data (sessions, answers, feedback, events, customers)

See `firebase/firestore.rules` for the complete rules.

## Cloud Functions

### generateReviewDraft
Generates AI review drafts using the Anthropic API. Called from the client after quiz completion.

### aggregateAnalytics
Aggregates analytics data for the dashboard. Can be scheduled to run periodically.

### cleanupOldSessions
Removes abandoned sessions older than 30 days. Runs daily.

## Environment Variables

### Client-Safe (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Server-Side (Never expose to browser)
```
FIREBASE_SERVICE_ACCOUNT_KEY
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
SESSION_COOKIE_SECRET
HASH_SALT
```

## Deployment

```bash
# Deploy all Firebase services
firebase deploy

# Deploy specific services
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only functions
firebase deploy --only hosting
```

## Monitoring

- **Firebase Console:** Monitor usage, errors, and performance
- **Cloud Logging:** View detailed logs for Cloud Functions
- **Firestore Metrics:** Track read/write operations and latency
