<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

**ReviewPulse**

ReviewPulse is a QR-based customer feedback platform for restaurants. Customers scan a QR code, complete a quick 5-question quiz, receive an optional AI-generated review draft (editable), and are handed off to the restaurant's Google review page. Business owners get a dashboard with response analytics, campaign management, and private feedback — all without manipulating who gets to review.

**Core Value:** Turn every restaurant visit into (a) structured experience data the owner can act on and (b) an easy, authentic path to leave a public Google review — without steering, incentivizing, or filtering by rating.

### Architecture

- **Backend:** Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui
- **Auth:** Firebase Auth (email/password) + custom session cookies
- **AI:** Anthropic API (server-side) with deterministic fallback
- **Rate Limiting:** Upstash Redis + `@upstash/ratelimit`
- **Bot Filter:** `isbot` package
- **Deployment:** Single-client-per-deployment (white-label template)

### Constraints

- **Tech stack (fixed):** Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui (Radix) + Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Styling:** Tailwind CSS + shadcn/ui with Radix primitives for accessibility
- **DB access:** Firebase Admin SDK (server-side), Firebase Client SDK (client-side)
- **Validation:** Zod (shared client/server schemas)
- **Session:** `jose` for signed `rp_session` cookie + Firebase ID token cookie
- **Bot filter:** `isbot` package
- **LLM:** Anthropic API behind `DraftGenerator` interface, `claude-haiku-4-5` default (swappable via config)
- **QR:** `qrcode` npm package, server-side PNG/SVG
- **Rate limiting:** Upstash Redis + `@upstash/ratelimit`
- **Testing:** Vitest (unit), Playwright + axe-core (E2E + a11y)
- **Observability:** Structured logs
- **CI/CD:** GitHub Actions, Firebase CLI
- **Hosting:** Vercel / Firebase Hosting

### White-Label Template

This repository is a **master template** for single-client-per-deployment. Each restaurant gets:

- Its own Firebase project
- Its own Firestore database
- Its own Firebase Authentication
- Its own Firebase Storage
- Its own environment configuration
- Its own deployment

The configuration system is in `src/config/`:
- `schema.ts` — Zod-validated config schema
- `loader.ts` — Centralized config loader
- `branding.ts` — Branding token resolver
- `features.ts` — Feature flag resolver

Client-specific configuration goes in `config.json` (see `templates/client-config.example.json`).

### Key Breaking Changes (Next.js 16)

- `middleware.ts` → `proxy.ts` (function renamed to `proxy`)
- Route handlers use Web Request/Response APIs
- Environment variables loaded from `.env*` files

## Conventions

- All restaurant-specific values come from `config.json` via `getRestaurantConfig()`
- Never hardcode restaurant names, colors, phone numbers, or URLs in components
- Use `getBrandingTokens()` for dynamic theming
- Use `getFeatureFlags()` for feature-gating
- Firebase Admin SDK is server-only (use `import 'server-only'`)
- Firebase Client SDK is client-only (use `'use client'`)
