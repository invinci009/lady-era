# ReviewPulse — Product Requirements Document (v1.1, agent-ready)

**Status:** MVP specification. Supersedes v1.0.
**Product:** QR-based customer feedback platform for restaurants that (1) collects structured feedback, (2) offers the customer an *optional, editable* review draft built only from their own answers, (3) hands them to the business's Google review page, and (4) gives the owner analytics.

---

## 0. How to read this document (READ FIRST — applies to humans and AI agents)

1. **Normative words.** MUST / MUST NOT = mandatory. SHOULD = default unless there is a written reason. MAY = optional.
2. **Priorities.** Every requirement has an ID and a priority: **P0** = required for MVP, **P1** = build after all P0 pass, **P2** = do NOT build now (documented only so the design does not block it).
3. **Precedence when text conflicts:** Section 3 (Compliance Guardrails) > Section 17 (Acceptance Criteria) > Sections 5–15 (feature specs) > Appendix. If two statements still conflict, stop and raise it in the PR/issue; do not guess.
4. **No invention.** If a detail is not specified (copy text, colors, limits), use the stated **default**. If there is no default, choose the simplest option, record it in `DECISIONS.md`, and continue. Never add features listed as P2 or Out of Scope (Section 18).
5. **Sample data is not default data.** Menu items like "Chicken Biryani" are examples only. The system ships with **zero** menu items.
6. **Canonical names.** Event names, question keys, enums and table names in this document are exact. Do not rename or create synonyms (e.g. there is no `SCAN_STARTED`; the event is `QR_SCANNED`).
7. **Assumptions** are marked `ASSUMPTION` and collected in Section 19. They are defaults awaiting owner confirmation, not verified facts.

---

## 1. Product summary

| Item | Definition |
|---|---|
| Customer | A restaurant guest with a smartphone, no account. |
| Business user | Restaurant owner (single owner account per business in MVP). |
| Entry point | A QR code printed for a **campaign** (table, counter, bill, takeaway, packaging). |
| Customer output | Structured answers + optional review draft + link to Google review page. |
| Business output | Response list and aggregate analytics computed from stored answers and events. |
| MVP vertical | **Restaurants only.** Other local-business types are P2. |

**Core value:** turn every visit into (a) structured experience data and (b) an easy path to leave an authentic public review — without manipulating who gets to review.

**Problem (why this exists):** owners see a Google rating but not *why* customers feel that way (dish, service, time of day, channel). Informal complaints (staff, WhatsApp, calls) are not aggregated.

---

## 2. Scope

### 2.1 In scope (MVP)
Business auth · business + campaign creation · QR generation (PNG/SVG) · mobile landing page · 5-question default quiz · anonymous sessions · answer storage · review-draft generation with validation · draft editing · Google hand-off · private feedback · event tracking · basic analytics · English + Hindi (P1).

### 2.2 Out of scope — do not build (see also Section 18)
Automatic Google posting · customer login · native apps · CRM · loyalty · POS integration · WhatsApp/SMS · staff performance analytics · automated recovery tickets · multi-location · verifying that a Google review was actually published · rewards/incentives of any kind.

---

## 3. Compliance guardrails (NON-NEGOTIABLE — highest precedence)

Why these exist: Google's Maps user-generated content policy prohibits merchants from discouraging negative reviews or selectively soliciting positive ones, from offering incentives, and from requesting specific review content. A tool that violates this can get a client's reviews removed or profile penalized. These are product rules, not legal advice.

| ID | Rule |
|---|---|
| CG-1 | **Equal access.** Every customer who finishes (or skips) the quiz MUST see the same Google CTA, with the same prominence, regardless of any rating. No rating-based branching, hiding, delaying or de-emphasizing of the Google CTA. |
| CG-2 | **No rating-based routing.** The private-feedback option MUST be shown to **all** customers identically (same text, same position), not only to low raters. |
| CG-3 | **No incentives.** No discounts, freebies, contests or rewards tied to reviewing, to review content, or to removing/revising a review. |
| CG-4 | **Draft is optional and customer-owned.** It MUST be labeled "Draft based on your answers — edit or replace it". The customer can edit, delete, rewrite, or ignore it. The system MUST NOT post anything on the customer's behalf. |
| CG-5 | **No steering of content.** Drafts MUST NOT include staff names, discount/promo language, calls to action, links, phone numbers, or star-rating claims. The product MUST NOT instruct customers what to write. |
| CG-6 | **Truthful drafts.** A draft may contain only facts present in the customer's answers (Section 8). It MUST preserve sentiment: never turn a low rating into praise. |
| CG-7 | **Non-repetitive.** Drafts for different customers MUST NOT be near-identical templates. (Google's policy lists repetitive content as prohibited; see Section 8.6.) |
| CG-8 | **No pressure.** Copy MUST say feedback and review are optional. No countdowns, guilt copy or "please give 5 stars". Business-owned shared devices/kiosks are not supported; customers use their own phone. |
| CG-9 | **Honest metrics.** "Google click" ≠ "review". The UI, API and docs MUST NOT call a click a review or a posted review. Status stays `GOOGLE_CLICKED`. |
| CG-10 | **No fabricated or suppressed data.** Dashboards MUST NOT filter out negative responses; analytics include all completed sessions. Anomaly flags are for owner review, never auto-deletion. |

---

## 4. Glossary (single meaning per term)

| Term | Meaning |
|---|---|
| Business | One restaurant account (tenant). `business_id` is the tenant boundary. |
| Campaign | One QR placement (e.g. "Tables"). Has a unique `slug`. |
| Session | One customer's attempt, created when a QR page is first loaded. Identified by UUID. |
| Scan | A **new session created** by loading `/r/{slug}`. Scans == sessions. Rescans inside an active session do not create a new scan. |
| Active session | Session with status ≠ `completed` and last activity within 30 minutes (ASSUMPTION). |
| Quiz completed | Session submitted via the submit endpoint; status `completed`. |
| Draft | Generated review text (`original_text`) plus the customer's edited version (`final_text`). |
| Google click | Customer pressed the Google CTA; `GOOGLE_CLICKED` event recorded. Not proof of a review. |
| Private feedback | Optional message from customer to the business (not public). |
| Core question | One of the seven system question keys in Section 7.2. Feeds core analytics. |
| Custom question | Business-added question (`key` starts `custom_`). Stored and listed, but not in core analytics in MVP. |

---

## 5. Actors

| Actor | Auth | MVP capabilities |
|---|---|---|
| Customer | None (anonymous cookie session) | Scan, answer quiz, view/edit draft, go to Google, send private feedback. |
| Business owner | Supabase Auth (email+password; Google OAuth is P1) | Everything in Section 10. One owner per business in MVP. |
| Staff/manager | — | P2. Do not build roles. |
| System/agent | Service role (server only) | Writes customer data, generates drafts, computes analytics. |

---

## 6. End-to-end flow and session state machine

### 6.1 Customer flow (canonical order)

```
Scan QR → /r/{slug} (landing) → Q1 → Q2 → Q3 → Q4 → Q5 [→ Q6, Q7 if enabled]
   → Submit (answers saved, session = completed)
   → Draft screen (draft generated; edit / copy / Google / private feedback / done)
   → Thank-you screen
```

Screens (customer): `Landing`, `Question` (one per screen), `Draft`, `PrivateFeedback`, `ThankYou`, `Fallback` (invalid/inactive QR). Target total time: 20–30 seconds for the default quiz.

### 6.2 Session status (stored in `sessions.status`)

| Status | Set when |
|---|---|
| `landed` | Session created on landing load. |
| `in_progress` | First answer saved / Start pressed. |
| `completed` | Submit succeeds. Irreversible. |

`GOOGLE_CLICKED`, `DRAFT_EDITED`, `PRIVATE_FEEDBACK_SUBMITTED` are **events, not statuses** (they are not mutually exclusive). "Abandoned" is derived: not completed and inactive > 30 min.

### 6.3 Rules
- Submit is **idempotent**: a second submit for the same session returns the stored result (HTTP 200), never a duplicate.
- Answers are saved per question as the customer advances (so refresh/exit keeps partial data).
- After `completed`, answers are read-only for the customer.

---

## 7. Customer app specification

### 7.1 Landing page (P0)
- Route: `/r/{slug}`. Server-rendered, minimal JS.
- Shows: business logo (optional), business name, welcome message, "Start" button, one line: "Takes about 30 seconds. Feedback and reviews are optional."
- Business-configurable: logo, name, primary color, welcome message (defaults: no logo, "Thanks for visiting! We'd love to hear about your experience today.").
- On first load with no valid session cookie: create session, set `rp_session` cookie (httpOnly, signed, 24h), fire `QR_SCANNED` then `LANDING_VIEWED`.
- Known bots/link-preview user agents MUST NOT create sessions.
- Invalid slug or `campaign.active = false` → `Fallback` screen: "This QR code is no longer active." No session created.

### 7.2 Question specification (canonical keys)

**All ratings are integers 1–5.** 1 = worst, 5 = best. Emoji/star/label UIs are only presentation; stored value is the integer.

| # | Key | Type | Required | Stored value | Enabled by default | UI |
|---|---|---|---|---|---|---|
| Q1 | `overall_rating` | rating | **Yes** | int 1–5 | Yes | 5 stars |
| Q2 | `food_rating` | rating | **Yes** (restaurants) | int 1–5 | Yes | 5 emoji faces (😞 😕 😐 🙂 😍) |
| Q3 | `service_rating` | rating | **Yes** | int 1–5 | Yes | 5 labeled buttons (Poor … Excellent) |
| Q4 | `liked` | multi-choice | No | array of enum: `food`,`service`,`ambience`,`portion_size`,`presentation`,`value` | Yes | Chips |
| Q5 | `ordered` | multi-choice | No | array of `menu_item_id` and/or `"other"` | Yes, **but hidden if the business has 0 active menu items** | Chips from `menu_items` + "Other" |
| Q6 | `comment` | text | No | string ≤ 500 chars | **No** (configurable) | Textarea |
| Q7 | `return_intent` | single-choice | No | enum: `definitely`,`probably`,`maybe`,`probably_not` | **No** (configurable) | Radio |

- Default quiz = Q1–Q5 (this is "the 5-question quiz"). If Q5 is hidden, the quiz has 4 questions; that is valid.
- Enable/disable, reorder: P0 for enable/disable, P1 for reorder. Required flags for Q1–Q3 cannot be turned off.
- Custom questions (P1): types `single_choice`, `multi_choice`, `rating`, `text`; key `custom_{uuid8}`; max 3 custom questions in MVP (ASSUMPTION).
- Library questions (P1, off by default): `improve_attributes` (multi-choice, "What could be better?", same enum as Q4 plus `waiting_time`,`cleanliness`), `ambience_rating`, `value_rating`, `cleanliness_rating`, `waiting_time_rating` (ratings 1–5).
- Every question has one screen, large touch targets, a Back control, and progress indicator. Optional questions have "Skip".

### 7.3 Submit
- Validates required answers (Q1–Q3 present, ints 1–5) server-side. Client validation is convenience only.
- On success: `sessions.status = completed`, `completed_at = now()`, fire `QUIZ_COMPLETED`, then show `Draft` screen.
- Copy on submit: "Thank you — we've recorded your feedback."

### 7.4 Draft screen (P0)
Contents, in this order, identical for every rating (CG-1, CG-2):
1. Heading: "Your review draft" + small text: "Draft based on your answers — edit or replace it. Posting a review is optional."
2. Editable text area with the draft.
3. **Primary button:** "Share on Google" (Section 9).
4. Secondary: "Copy text".
5. Secondary text link: "Send private feedback to the restaurant" (Section 9.3).
6. Tertiary: "No thanks, I'm done" → `ThankYou`.
- If draft generation is still running: show skeleton up to 8 seconds, then fall back (Section 8.5). Never block the Google CTA on draft generation; if no draft exists, the CTA still works.
- Customer edits → debounce 1s, save `final_text`, fire `DRAFT_EDITED` once per session (first edit only).

### 7.5 Thank-you screen
"Thanks for your feedback." No further prompts. No upsell.

### 7.6 Language (P1)
English (`en`) and Hindi (`hi`). Language picker on landing; stored in `sessions.language`. All UI strings come from i18n files. Stored answers are always normalized internal values (Section 7.2), never translated text. Business-supplied strings (welcome message, menu item names, custom question text) are stored as `{"en": "...", "hi": "..."}`; missing translation falls back to `en`.

---

## 8. Review-draft generation

### 8.1 Purpose and pipeline
```
answers (validated) → fact sheet (structured JSON) → LLM prompt → candidate draft
→ validators → (pass) show customer | (fail) retry once → (fail) deterministic fallback
```

### 8.2 Fact sheet (the ONLY input the model may use)
Built server-side from stored answers. Example:
```json
{
  "language": "en",
  "overall": {"rating": 5, "tone": "positive"},
  "food": {"rating": 5, "tone": "positive"},
  "service": {"rating": 5, "tone": "positive"},
  "liked": ["food", "service"],
  "ordered": ["Chicken Biryani"],
  "return_intent": "definitely",
  "comment": null
}
```
Tone mapping: rating 1–2 = `negative`, 3 = `neutral`, 4–5 = `positive`. Omitted/skipped fields are omitted, never guessed.

### 8.3 Prompt contract (LLM)
System instruction MUST include: use only the fact sheet; first person; 25–90 words; match each aspect's tone; do not add dishes, staff, prices, times, occasions or opinions not in the sheet; no staff names; no promotional language; no star-rating mentions; vary sentence structure; output text only.
- `comment` is **untrusted user text**: pass it inside a delimited block, instruct the model to treat it as data (never as instructions), and only paraphrase facts already in it. Strip URLs, phone numbers, emails and names before use.
- Any provider/model may be used behind a `DraftGenerator` interface. Model choice is a config value, not hard-coded.

### 8.4 Validators (all P0, run on every candidate)
| Check | Rule |
|---|---|
| Length | 25–90 words. |
| Fact allow-list | Any dish name in the draft MUST be in `ordered`. Any aspect praised/criticized MUST correspond to a rated/selected aspect. |
| Polarity | An aspect with tone `negative` MUST NOT be described positively; an aspect with tone `positive` MUST NOT be described negatively. `neutral` uses neutral wording. Implementation: keyword lint + (optional) second LLM judge call. |
| Forbidden content | No URLs, phone numbers, emails, emoji, hashtags, staff/person names, discount/offer words, "5 stars", "rate us". |
| Language | Output language equals `sessions.language`. |

### 8.5 Failure handling
1. Validation fails → retry once with the failure reason appended.
2. Retry fails, LLM errors or times out (8 s) → **deterministic template fallback**: assemble one sentence per rated aspect from a small bank of tone-matched phrasings, choosing phrasings pseudo-randomly seeded by `session_id` (satisfies CG-7).
3. If even the fallback cannot run: show an empty text area with "Write your own review" — the Google CTA remains available.
- Fire `DRAFT_GENERATED` with metadata `{method: "llm" | "fallback" | "none", attempts: n}`.

### 8.6 Anti-repetition (CG-7)
Do not cache or reuse drafts across sessions. Log a hash of each `original_text`; if more than 3 drafts with identical hash occur for one business in 24 hours, raise an owner-visible "Potentially anomalous activity" flag and force fallback phrasing variation. (Thresholds: ASSUMPTION.)

### 8.7 Examples (for tests)
| Input | Acceptable | NOT acceptable |
|---|---|---|
| overall 5, food 5, service 5, liked [food, service], ordered [Chicken Biryani], return `definitely` | "Really enjoyed my visit. The chicken biryani was excellent and the service was very good. I'd definitely go back." | Mentions ambience, a waiter's name, or "best in the city". |
| overall 3, food 2, service 4 | "The service was good, but the food didn't fully meet my expectations. An okay visit overall." | "The food was delicious." |
| overall 1, food 1, service 2 | A brief, respectful negative draft using only the given facts. | Softening to neutral/positive, or omitting the low ratings. |

---

## 9. Google hand-off and private feedback

### 9.1 Google URL
- Stored on `businesses.google_review_url` (business-level default). A campaign MAY override with `campaigns.google_review_url_override` (P1).
- Validation on save: must be `https`, and host must be in an allow-list (ASSUMPTION: `google.com`, `search.google.com`, `g.page`, `maps.app.goo.gl`, `goo.gl`). The owner is told to copy the review link from their Google Business Profile. **Verify the exact link format against Google Business Profile documentation before release.**
- If missing: Google CTA hidden, "Copy text" still available, and the owner sees a dashboard warning ("Add your Google review link").

### 9.2 "Share on Google" behavior
On press: (1) save latest `final_text`; (2) try to copy `final_text` to the clipboard and show "Copied — paste it into Google if you'd like to use it"; (3) record `GOOGLE_CLICKED`; (4) open the Google URL in a new tab; (5) original tab shows `ThankYou`.
- The system MUST NOT claim a review was posted, and MUST NOT try to pre-fill the star rating.
- If the new tab is blocked or Google fails to open: show the URL and "Copy text".
- Customer without a Google account: can finish via "No thanks, I'm done" or private feedback.

### 9.3 Private feedback (P1 in the "Should have" list; if built, follows CG-2)
Form fields: `category` (enum `food`,`service`,`waiting_time`,`cleanliness`,`billing`,`other`), `message` (required, ≤ 1000 chars), optional `contact_name`, optional `contact_value` (phone or email). If contact is given, show a consent line: "The restaurant may use this to reply to you." Contact is never required. Fire `PRIVATE_FEEDBACK_SUBMITTED`. Owner sees it in the Feedback screen. No ticketing/status workflow in MVP.

---

## 10. Business dashboard specification

### 10.1 Auth and onboarding (P0)
Email+password via Supabase Auth. Onboarding steps, in order: (1) account, (2) business info: name, category (`restaurant` only in MVP), location, timezone (default `Asia/Kolkata`, ASSUMPTION), logo (optional), (3) Google review URL, (4) first campaign, (5) quiz config (default preloaded), (6) add menu items (optional), (7) generate/download QR. Steps 3, 5, 6 may be skipped and completed later.

### 10.2 Screens
`Login`, `Dashboard`, `Campaigns` (list, create, edit, deactivate), `Quiz Builder`, `Menu Items`, `QR Generator`, `Analytics`, `Responses` (list + detail), `Private Feedback`, `Settings`.

### 10.3 Campaigns and QR
- Campaign fields: `name`, `slug` (unique globally, lowercase `a-z0-9-`, 6–40 chars, auto-generated random 8-char default), `active`.
- QR encodes `https://{APP_DOMAIN}/r/{slug}`. Formats: PNG, SVG (P0). PDF sheet/table-tent templates: P2.
- Deactivating a campaign immediately makes its QR show `Fallback`. Data is retained.
- Changing a slug invalidates printed QRs — the UI MUST warn before allowing it (slug editing is P1; P0 = slug immutable).

### 10.4 Analytics (P0 unless marked)
All numbers computed from `events`, `sessions`, `answers` (never from manually incremented counters). Include **all** completed sessions (CG-10). Times displayed in the business timezone.

| Metric | Exact definition |
|---|---|
| Scans | count of `QR_SCANNED` events |
| Starts | count of `QUIZ_STARTED` events |
| Completions | count of `QUIZ_COMPLETED` events |
| Start rate | Starts ÷ Scans |
| Completion rate | Completions ÷ Starts |
| Scan-to-completion | Completions ÷ Scans |
| Google click rate | sessions with ≥1 `GOOGLE_CLICKED` ÷ Completions |
| Private feedback rate | sessions with `PRIVATE_FEEDBACK_SUBMITTED` ÷ Completions |
| Google clicks | count of **distinct sessions** with `GOOGLE_CLICKED` (label: "Google clicks", never "reviews") |
| Average overall / food / service | mean of integer ratings over completed sessions that answered that question; show `n` |
| Rating distribution | count per rating value 1–5 |
| "What customers liked" | for each `liked` value: sessions selecting it ÷ completed sessions that answered Q4 |
| Low-rating share | sessions with rating ≤ 2 ÷ completed sessions, per dimension (this is the MVP "weak spots" view) |
| Campaign table | Scans, Completions, Google clicks, rates — per campaign |
| Item table (menu items only) | Mentions = sessions whose `ordered` includes the item; Avg food rating = mean `food_rating` of those sessions (label: "Avg food rating in sessions mentioning this item"); Positive share = share of those sessions with `food_rating ≥ 4`. Note: rating is per session, not per item. |
| Trends and time-of-day (P1) | Weekly average per dimension; hour-bucket average overall. Show a bucket only if it has ≥ 30 completed sessions (ASSUMPTION); otherwise "Not enough data". Never generate written insights from small samples. |

Not in MVP dashboard: Ambience/Value/Cleanliness *scores* (no rating question exists by default; only "liked %" from Q4 unless the library rating questions are enabled), staff analytics, complaint-resolution metrics.

### 10.5 Responses
List with filters (date range, campaign, overall rating). Detail shows the answers, the private-feedback link if any, and the event timeline. `original_text`/`final_text` shown if within retention. Export CSV is P1.

---

## 11. Event tracking

Events are **append-only** (no updates/deletes except retention purge). One row per event.

| Event | Fired when | Metadata |
|---|---|---|
| `QR_SCANNED` | New session created on `/r/{slug}` | `user_agent_class` |
| `LANDING_VIEWED` | Landing rendered for the session | — |
| `QUIZ_STARTED` | Customer presses Start (once per session) | — |
| `QUESTION_ANSWERED` | An answer is saved | `question_key` |
| `QUIZ_COMPLETED` | Submit succeeds (once per session) | `duration_ms` |
| `DRAFT_GENERATED` | Draft created | `method`, `attempts` |
| `DRAFT_EDITED` | First edit of the draft | — |
| `GOOGLE_CLICKED` | Google CTA pressed | — |
| `PRIVATE_FEEDBACK_SUBMITTED` | Private form submitted | `category` |

Idempotency: each client-originated event carries a `client_event_id` (UUID); unique on `(session_id, client_event_id)`. Retries never duplicate. Every event row also stores `campaign_id` and `business_id` (denormalized for tenant-safe analytics queries).

---

## 12. Data model (PostgreSQL / Supabase)

Types are indicative; keep constraints. All tables: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()` unless noted. RLS enabled on **every** table.

```sql
businesses(
  id, owner_id uuid references auth.users, name text not null,
  category text not null default 'restaurant' check (category in ('restaurant')),
  location text, timezone text not null default 'Asia/Kolkata',
  logo_url text, primary_color text, welcome_message jsonb,
  google_review_url text, default_language text default 'en',
  updated_at timestamptz
)

campaigns(
  id, business_id references businesses, name text not null,
  slug text not null unique, active boolean not null default true,
  google_review_url_override text,           -- P1
  updated_at timestamptz
)

menu_items(
  id, business_id references businesses, name jsonb not null,  -- {"en": "..."}
  active boolean default true, position int
)

questions(
  id, business_id references businesses,
  key text not null,                         -- core keys or custom_xxxxxxxx
  type text not null check (type in ('rating','single_choice','multi_choice','text')),
  text jsonb not null,                       -- i18n
  config jsonb default '{}',                 -- options etc.
  required boolean not null default false,
  position int not null, active boolean not null default true,
  unique (business_id, key)
)

sessions(
  id, campaign_id references campaigns, business_id references businesses,
  status text not null default 'landed' check (status in ('landed','in_progress','completed')),
  language text default 'en', device_type text,
  started_at timestamptz default now(), last_activity_at timestamptz default now(),
  completed_at timestamptz,
  ip_hash text, ua_hash text                 -- salted hashes for anomaly detection only
)

answers(
  id, session_id references sessions, question_id references questions,
  question_key text not null,                -- denormalized for analytics
  value jsonb not null,                      -- int | string | array (per Section 7.2)
  unique (session_id, question_id)
)

review_drafts(
  id, session_id references sessions unique,
  original_text text, final_text text, method text, updated_at timestamptz
)

private_feedback(
  id, session_id references sessions, business_id references businesses,
  category text not null, message text not null,
  contact_name text, contact_value text, contact_consent boolean default false
)

events(
  id, session_id references sessions, campaign_id uuid, business_id uuid,
  event_type text not null, client_event_id uuid,
  metadata jsonb default '{}', timestamp timestamptz default now(),
  unique (session_id, client_event_id)
)

session_flags(
  id, session_id references sessions, business_id uuid,
  reason text not null                       -- see Section 13.3
)
```
There is no `experience_record` table; the "experience record" is the join of `sessions` + `answers`. Analytics may use SQL views/materialized views over these tables.

---

## 13. Security, privacy, anomaly detection

### 13.1 Tenant isolation (P0)
- `business_id` is the tenant boundary. Owner RLS policy: a row is readable/writable only if its business's `owner_id = auth.uid()`.
- **Customer-facing writes go only through server endpoints using the service-role key.** The anonymous (public) Supabase client MUST have no direct table access. Customer endpoints never return other sessions' data or private business config beyond the public landing fields.
- Session cookie is signed; every customer endpoint verifies that the `session_id` in the path matches the cookie.

### 13.2 Privacy
- Default customer flow collects no name, phone, email or account. Contact info exists only in optional private feedback with the consent line.
- Store IP and user agent only as salted hashes (`ip_hash`, `ua_hash`); raw values are not persisted.
- Design for India's DPDP Act: purpose-limited collection, plain-language notice, retention limits, deletion on request. Per the published DPDP Rules timeline, the main notice/consent/retention obligations commence 18 months after Nov 2025 notification (about May 2027) — treat compliance as a design constraint now; confirm applicability with counsel.
- Retention defaults (ASSUMPTION, owner to confirm): sessions/answers/events 24 months; draft texts and comments 12 months; private-feedback contact fields 90 days after the owner marks handled or 12 months, whichever first; `ip_hash`/`ua_hash` 30 days. A scheduled job purges accordingly.
- Customer-facing privacy notice link on the landing page (footer). Owner-facing "delete my business data" (P1).

### 13.3 Anomaly detection (P1; flag only)
Label used in UI: **"Potentially anomalous activity"**. Never "fraud". Never blocks or deletes.
Flag reasons (defaults are ASSUMPTIONS): `burst` (>5 sessions with same `ip_hash`+`ua_hash` on one campaign within 10 minutes), `too_fast` (completion < 5 seconds), `repeat_identical` (≥3 sessions on one campaign with identical answers in 1 hour), `duplicate_drafts` (Section 8.6).

### 13.4 Rate limiting
Public endpoints: per-IP limits (ASSUMPTION: 60 requests/min) with `429` and retry-safe idempotency.

---

## 14. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Customer landing: initial load < 2 s on a typical mobile network (target, measure with Lighthouse mobile throttling). Use server components, no heavy client libraries, optimized/inlined critical CSS, cached static assets. Works on low-end Android. |
| Accessibility | WCAG 2.1 AA target: touch targets ≥ 44×44 px, screen-reader labels, keyboard navigation, visible focus, sufficient contrast, no color-only meaning (rating UIs also show numbers/labels). |
| Connectivity | On network failure show "Connection lost. Please check your connection and try again." with a Retry button; retries are idempotent. Offline queueing is P2. |
| Browsers | Latest two versions of Chrome and Safari on mobile; latest Chrome/Edge/Safari/Firefox on desktop dashboard. |
| Observability | Structured server logs with `session_id`/`business_id`; error tracking; draft-generation method and latency logged. |

---

## 15. Technology decisions (fixed for MVP — do not re-litigate)

| Layer | Decision |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers / Server Actions. **No separate FastAPI service in MVP.** |
| Database/Auth/Storage | Supabase (PostgreSQL, Auth, Storage) with RLS on all tables |
| LLM | Behind a `DraftGenerator` interface; provider/model set via environment config |
| QR | Server-side generation of PNG and SVG |
| Config | `APP_DOMAIN`, Supabase keys, LLM key, cookie signing secret, hash salt as env vars; no secrets in client bundles |

### 15.1 API surface (public, all under `/api/public`; session via `rp_session` cookie)
| Method + path | Purpose |
|---|---|
| `POST /sessions` | Create/restore session for `{slug}`; returns landing config |
| `PUT /sessions/{id}/answers/{question_key}` | Upsert one answer |
| `POST /sessions/{id}/start` | Mark started, fire `QUIZ_STARTED` |
| `POST /sessions/{id}/submit` | Validate + complete (idempotent) |
| `POST /sessions/{id}/draft` | Generate draft (idempotent; returns existing if present) |
| `PATCH /sessions/{id}/draft` | Save `final_text` |
| `POST /sessions/{id}/events` | Client events (`GOOGLE_CLICKED`, `DRAFT_EDITED`) |
| `POST /sessions/{id}/private-feedback` | Submit private feedback |

Dashboard data access uses authenticated Supabase queries/server actions under owner RLS.

---

## 16. Edge cases (expected behavior)

| Case | Behavior |
|---|---|
| Customer exits mid-quiz | Partial answers kept; session stays `in_progress` (derived "abandoned" after 30 min). |
| Refresh | Restore session from cookie, resume at first unanswered required question. |
| Rescan while session active | Reuse session; no new `QR_SCANNED`. |
| Rescan after completed / >30 min inactivity | New session (new scan). |
| Invalid QR / campaign inactive | `Fallback` screen, no session. |
| Google URL missing | Hide Google CTA; keep Copy text; owner warned in dashboard. |
| Google tab fails to open | Show link + Copy text. |
| Customer declines to review | "No thanks" → ThankYou; no pressure. |
| Negative ratings | Same screens and CTAs as positive (CG-1, CG-2). |
| No Google account | Can finish without Google. |
| Double-tap / network retry | Idempotent endpoints; no duplicate rows/events. |
| LLM down or invalid output | Section 8.5 fallback; Google CTA never blocked. |
| Malicious `comment` text (prompt injection, URLs, PII) | Treated as data; sanitized per Section 8.3. |
| Two owners / staff logins | Not supported in MVP. |
| Menu has 0 items | Q5 hidden. |

---

## 17. Acceptance criteria (testable; MVP is done when all P0 pass)

### Customer
- AC-C1 Scanning a valid campaign QR opens its landing page, creates exactly one session and one `QR_SCANNED` event.
- AC-C2 An invalid or inactive slug shows the Fallback screen and creates no session.
- AC-C3 The quiz can be completed with no account, no name/phone/email.
- AC-C4 Q1–Q3 cannot be skipped; server rejects missing/out-of-range ratings.
- AC-C5 Submitting twice yields one `QUIZ_COMPLETED` event and unchanged stored answers.
- AC-C6 A draft is shown for every completed session; for the fact sheets in Section 8.7 no validator failure reaches the customer.
- AC-C7 A draft for `food_rating = 2` never describes food positively (automated test with ≥ 20 varied fact sheets).
- AC-C8 Editing the draft stores `final_text` and `original_text` separately and fires `DRAFT_EDITED` once.
- AC-C9 For overall rating 1, 3 and 5, the Draft screen has identical CTAs, order and prominence (snapshot test) — CG-1, CG-2.
- AC-C10 "Share on Google" records `GOOGLE_CLICKED`, opens the URL, and no UI anywhere says a review was posted.
- AC-C11 A customer can leave without posting.
- AC-C12 Refresh mid-quiz restores progress.
- AC-C13 With the LLM disabled, a fallback draft still appears and the flow completes.

### Business
- AC-B1 Owner can sign up, create a business, set a Google URL, create a campaign and download a working PNG and SVG QR.
- AC-B2 Owner can enable/disable quiz questions and add menu items; Q5 appears only when items exist.
- AC-B3 Owner sees responses and aggregate analytics whose numbers match the Section 10.4 definitions on a seeded dataset.
- AC-B4 Owner can deactivate a campaign; its QR then shows Fallback.
- AC-B5 Cross-tenant test: Owner A cannot read or write any row of Business B via the dashboard, API, or direct Supabase client (automated RLS tests).
- AC-B6 Public Supabase client (anon key) cannot read or write any table directly.

### Non-functional
- AC-N1 Landing page Lighthouse mobile performance meets the < 2 s load target on the reference throttling profile.
- AC-N2 Accessibility: automated audit (axe) has no critical violations on customer screens.

---

## 18. Explicitly out of scope / do not build

Auto-posting or scraping Google reviews · customer accounts · incentives or rewards · rating-based routing of customers · verifying published reviews · staff-name questions or staff analytics · ticketing/recovery workflows · WhatsApp/SMS/email campaigns · multi-location or multi-user roles · POS integrations · Google Business Profile API integration · advanced AI insights/sentiment models · native apps · non-restaurant quiz templates.

---

## 19. Assumptions and open decisions (need owner confirmation)

| # | Assumption / open item | Default used |
|---|---|---|
| A1 | Active session window | 30 minutes |
| A2 | Retention periods (Section 13.2) | As listed |
| A3 | Default quiz enabled set (Q6/Q7 off) | Q1–Q5 on |
| A4 | Max custom questions | 3 |
| A5 | Google URL host allow-list; exact link format | Section 9.1 — must be verified against Google Business Profile docs |
| A6 | Anomaly thresholds and duplicate-draft threshold | Section 13.3 / 8.6 |
| A7 | Minimum sample size to show trends | 30 |
| A8 | Rate limit | 60 req/min/IP |
| A9 | Business timezone default | Asia/Kolkata |
| A10 | LLM provider/model and cost budget per draft | Not chosen |
| A11 | Legal review of the draft feature against Google policy (Section 3 CG-4/CG-5/CG-7) and applicable law | Recommended before launch |
| A12 | Hosting/deployment target | Not chosen |

---

## Appendix A — Vision and positioning (NON-NORMATIVE; do not implement from this section)

- Long-term direction: Customer experience → analytics → operational insights → recovery → public review. Modules considered later: customer intelligence, reputation management, recovery, campaign comparison, AI insights, multi-location.
- Positioning: sell the analytics, not the QR. "A customer experience intelligence platform that turns every visit into actionable feedback and an authentic review opportunity."
- The MVP's job is to prove the loop: scan → structured feedback → owner insight + optional authentic review path — before adding CRM, messaging, loyalty or enterprise features.

## Appendix B — Changelog from v1.0 (why things changed)

1. Fixed conflicting event name (`SCAN_STARTED` vs `QR_SCANNED`) → `QR_SCANNED`.
2. Resolved quiz size (5–7 vs 5) → default 5, Q6/Q7 optional and off.
3. Fixed rating scales (4 emojis vs 1–5) → all 1–5.
4. Removed dashboard metrics with no data source (Ambience/Value/Cleanliness scores).
5. Moved `google_review_url` to one place (business), campaign override P1.
6. Defined scan, start, completion and click metrics with one denominator each.
7. Made private feedback visible to all customers (was conditional on low rating in v1.0 §18) — avoids rating-based routing.
8. Defined draft validators, fallback, anti-repetition and prompt-injection handling (v1.0 had rules but no mechanism).
9. Added missing tables/constraints (`menu_items`, `private_feedback`, `session_flags`, `answers` value type, session status, idempotency).
10. Fixed stack ambiguity (Next.js only; FastAPI removed from MVP).
11. Added ID/priority scheme, precedence rules and explicit out-of-scope list.
