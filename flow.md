# ReviewPulse: DFD and Program Flow (consistent with PRD v1.1)

Notation for the DFDs: rectangles are external entities, circles are processes, cylinders are data stores, solid arrows are data flows, dashed arrows are hand-offs where no data returns. Store names are used identically in every diagram.

| Store | Tables |
|---|---|
| D1 Business + campaign config | businesses, campaigns, menu_items, questions |
| D2 Sessions + answers | sessions, answers |
| D3 Review drafts | review_drafts |
| D4 Private feedback | private_feedback |
| D5 Events | events (plus session_flags for anomaly review) |

---

## 1. DFD Level 0 (context)

```mermaid
flowchart LR
  C["Customer<br/>(anonymous)"]
  O["Business owner<br/>(Supabase Auth)"]
  G["Google review page<br/>(external)"]
  L["LLM provider"]
  S(("ReviewPulse<br/>system"))

  C -->|"QR scan, answers, draft edits, private feedback"| S
  S -->|"landing page, draft, Google link"| C
  O -->|"business, campaign, quiz, menu setup"| S
  S -->|"responses, analytics, QR files"| O
  S -.->|"redirect to review URL (no data returned)"| G
  S -->|"fact sheet (answers only)"| L
  L -->|"candidate draft"| S
```

---

## 2. DFD Level 1, customer side (processes 1 to 4)

```mermaid
flowchart LR
  C["Customer"]
  LLM["LLM provider"]
  G["Google review page"]

  P1(("1. Resolve QR<br/>+ start session"))
  P2(("2. Save answers<br/>+ submit quiz"))
  P3(("3. Generate +<br/>validate draft"))
  P4(("4. Hand-off +<br/>private feedback"))

  D1[("D1 Business + campaign config")]
  D2[("D2 Sessions + answers")]
  D3[("D3 Review drafts")]
  D4[("D4 Private feedback")]
  D5[("D5 Events")]

  C <-->|"QR scan / landing page"| P1
  C <-->|"answers / next question"| P2
  C <-->|"draft / edits"| P3
  C -->|"Google click, private feedback"| P4

  D1 -->|"campaign config, branding"| P1
  D1 -->|"question config, menu items"| P2
  P1 -->|"new session"| D2
  P2 -->|"answers, completed status"| D2
  D2 -->|"answers"| P3
  P3 <-->|"fact sheet / candidate draft"| LLM
  P3 -->|"original and final draft text"| D3
  P4 -->|"latest final draft text"| D3
  P4 -->|"category, message, optional contact"| D4
  P4 -.->|"redirect to review URL"| G
  P1 & P2 & P3 & P4 -->|"QR_SCANNED, QUIZ_COMPLETED, DRAFT_GENERATED, GOOGLE_CLICKED, ..."| D5
```

---

## 3. DFD Level 1, owner side (processes 5 and 6)

```mermaid
flowchart LR
  O["Business owner"]

  P5(("5. Owner setup<br/>business, campaign,<br/>quiz, QR"))
  P6(("6. Analytics +<br/>responses"))

  D1[("D1 Business + campaign config")]
  D2[("D2 Sessions + answers")]
  D3[("D3 Review drafts")]
  D4[("D4 Private feedback")]
  D5[("D5 Events")]

  O <-->|"setup inputs / QR files"| P5
  P5 -->|"business, campaigns, menu items, questions"| D1
  D1 -->|"names, menu items"| P6
  D2 -->|"answers"| P6
  D3 -->|"draft text"| P6
  D4 -->|"private feedback"| P6
  D5 -->|"events"| P6
  P6 -->|"responses, metrics"| O
```

All metrics are computed from D2 and D5 at query time (no stored counters). Every completed session is included (CG-10).

---

## 4. Program flow A: landing, session and submit/draft pipeline

```mermaid
flowchart TD
  subgraph A["A. Landing + session"]
    A0(["GET /r/:slug"]) --> A1{"Slug valid and<br/>campaign active?"}
    A1 -->|No| A1n["Fallback page, no session"]
    A1 -->|Yes| A2{"Known bot or<br/>link preview?"}
    A2 -->|Yes| A2y["Render page, no session"]
    A2 -->|No| A3{"Active session cookie,<br/>not completed?"}
    A3 -->|Yes| A3y["Reuse session"]
    A3 -->|No| A4["Create session, set rp_session cookie,<br/>log QR_SCANNED"]
    A4 --> A5["Render landing, log LANDING_VIEWED"]
    A3y --> A5
    A5 --> A6["PUT /answers/:key<br/>verify cookie, upsert answer,<br/>log QUESTION_ANSWERED"]
  end

  subgraph B["B. Submit + draft pipeline"]
    B0(["POST /submit"]) --> B1{"Session already<br/>completed?"}
    B1 -->|Yes| B1y["Return stored result, 200"]
    B1 -->|No| B2{"Q1 to Q3 present,<br/>integers 1 to 5?"}
    B2 -->|No| B2n["Reject with 400"]
    B2 -->|Yes| B3["Set status completed,<br/>log QUIZ_COMPLETED"]
    B3 --> B4["Build fact sheet, call LLM<br/>(8 s timeout)"]
    B4 -->|"error or timeout"| B8
    B4 --> B5{"Validators pass?<br/>facts, tone, length, forbidden content"}
    B5 -->|Yes| B7
    B5 -->|"No, first failure"| B6["Retry once with failure reason"]
    B6 --> B6c{"Validators pass?"}
    B6c -->|Yes| B7
    B6c -->|No| B8["Deterministic fallback template<br/>(phrasing seeded by session_id)"]
    B8 --> B7["Save draft, log DRAFT_GENERATED,<br/>return to customer"]
    B7 --> B9(["Google CTA is always enabled;<br/>it never waits on the draft"])
  end

  A6 -->|"customer taps Submit"| B0
```

---

## 5. Program flow B: draft edit, Google hand-off, private feedback

```mermaid
flowchart TD
  D0(["Draft screen shown<br/>(same options for every rating)"]) --> E{"Customer action"}

  E -->|"Edits text"| E1["Debounce 1 s, PATCH final_text"]
  E1 --> E2{"First edit this session?"}
  E2 -->|Yes| E3["Log DRAFT_EDITED"]
  E2 -->|No| E4["No event"]

  E -->|"Share on Google"| G1["Save latest final_text"]
  G1 --> G2["Try clipboard copy,<br/>show 'copied' message if it works"]
  G2 --> G3["Log GOOGLE_CLICKED"]
  G3 --> G4{"Google URL configured?"}
  G4 -->|Yes| G5["Open URL in new tab,<br/>this tab shows thank-you"]
  G4 -->|No| G6["CTA hidden earlier; Copy text still available,<br/>owner warned in dashboard"]
  G5 --> G7(["Status stays GOOGLE_CLICKED.<br/>Never reported as 'review posted'."])

  E -->|"Send private feedback"| F1["Form: category, message,<br/>optional contact + consent line"]
  F1 --> F2["Store in private_feedback,<br/>log PRIVATE_FEEDBACK_SUBMITTED"]
  F2 --> T(["Thank-you screen"])

  E -->|"No thanks"| T
  G5 --> T
```