# ReviewPulse — Firebase + White-Label Template Migration Plan

## Executive Summary

Migrate ReviewPulse from Supabase to Firebase, transforming it into a reusable single-client-per-deployment template. Each restaurant gets its own Firebase project, Firestore database, Auth instance, and deployment.

## Current Architecture

- **Backend:** Supabase (Postgres, Auth, Storage, RLS)
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui
- **Auth:** Supabase Auth + custom JWT session cookies
- **AI:** Anthropic API (server-side) with deterministic fallback
- **Rate Limiting:** Upstash Redis
- **Bot Filter:** isbot package

## Target Architecture

- **Backend:** Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Frontend:** Same stack, driven by centralized config
- **Auth:** Firebase Auth (email/password) + custom session cookies
- **AI:** Anthropic API (server-side, via Firebase Cloud Functions or API routes)
- **Rate Limiting:** Upstash Redis (retained)
- **Bot Filter:** isbot package (retained)

## Firestore Data Model

```
restaurant/
├── settings (doc) — restaurant config, branding, features
├── campaigns/{campaignId} — QR campaigns
├── menuItems/{itemId} — menu items for "ordered" question
├── questions/{questionId} — quiz questions
├── sessions/{sessionId} — customer sessions
├── answers/{answerId} — quiz answers (subcollection of sessions)
├── reviewDrafts/{draftId} — AI-generated review drafts
├── privateFeedback/{feedbackId} — private feedback inbox
├── customers/{customerId} — CRM customer records
├── events/{eventId} — analytics events (append-only)
└── sessionFlags/{flagId} — flagged sessions
```

## Migration Phases

### Phase 1: Firebase Foundation
- [ ] Install firebase, firebase-admin packages
- [ ] Create `src/lib/firebase/` abstraction layer
- [ ] Create Firebase client initialization (singleton pattern)
- [ ] Create Firebase Admin initialization (server-side)
- [ ] Create Firestore helpers
- [ ] Create Firebase Auth helpers
- [ ] Create Firebase Storage helpers

### Phase 2: Configuration System
- [ ] Create `src/config/schema.ts` — strongly typed RestaurantConfig
- [ ] Create `src/config/loader.ts` — centralized config loader
- [ ] Create `src/config/branding.ts` — branding token resolver
- [ ] Create `src/config/features.ts` — feature flag resolver
- [ ] Create `templates/client-config.example.json`
- [ ] Create `.env.example` with Firebase variables

### Phase 3: Firebase Security & Rules
- [ ] Create `firebase/firestore.rules`
- [ ] Create `firebase/storage.rules`
- [ ] Create `firebase/firebase.json` config
- [ ] Create `firebase/functions/` for server-side operations

### Phase 4: Authentication Migration
- [ ] Migrate login page to Firebase Auth
- [ ] Migrate auth API routes
- [ ] Migrate middleware to use Firebase Auth
- [ ] Migrate session cookie system
- [ ] Create password change/reset flows

### Phase 5: API Route Migration
- [ ] Migrate public session routes (create, start, submit)
- [ ] Migrate draft generation route
- [ ] Migrate private feedback route
- [ ] Migrate events route
- [ ] Migrate business settings routes
- [ ] Migrate campaigns routes
- [ ] Migrate menu routes
- [ ] Migrate QR generation route

### Phase 6: White-Label Template
- [ ] Remove all hardcoded restaurant values
- [ ] Create dynamic branding system (CSS variables)
- [ ] Create client config template
- [ ] Create deployment scripts
- [ ] Create validation scripts
- [ ] Create documentation

### Phase 7: Testing & Validation
- [ ] Test customer flow end-to-end
- [ ] Test dashboard authentication
- [ ] Test AI generation
- [ ] Test QR campaigns
- [ ] Test analytics
- [ ] Test compliance rules

## Key Principles

1. **No multi-tenant complexity** — one Firebase project per restaurant
2. **Configuration over code** — new clients only need config changes
3. **Preserve all functionality** — no feature removal
4. **Server-side secrets** — Anthropic key never exposed to browser
5. **Incremental migration** — working app after each phase
