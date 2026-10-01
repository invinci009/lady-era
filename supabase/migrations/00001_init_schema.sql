-- ReviewPulse Database Schema
-- PRD v1.1, Section 12

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- 1. BUSINESSES (tenant root)
-- =============================================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'restaurant' CHECK (category IN ('restaurant')),
  location TEXT,
  phone TEXT,
  secondary_phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  logo_url TEXT,
  primary_color TEXT,
  welcome_message JSONB,
  google_review_url TEXT,
  default_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- =============================================================
-- 2. CAMPAIGNS
-- =============================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  google_review_url_override TEXT,  -- P1
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- =============================================================
-- 3. MENU ITEMS
-- =============================================================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name JSONB NOT NULL,  -- {"en": "..."}
  active BOOLEAN DEFAULT true,
  position INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 4. QUESTIONS
-- =============================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rating', 'single_choice', 'multi_choice', 'text')),
  text JSONB NOT NULL,  -- i18n
  config JSONB DEFAULT '{}',
  required BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, key)
);

-- =============================================================
-- 5. SESSIONS
-- =============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'landed' CHECK (status IN ('landed', 'in_progress', 'completed')),
  language TEXT DEFAULT 'en',
  device_type TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  ip_hash TEXT,
  ua_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 6. ANSWERS
-- =============================================================
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,  -- denormalized for analytics
  value JSONB NOT NULL,  -- int | string | array
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

-- =============================================================
-- 7. REVIEW DRAFTS
-- =============================================================
CREATE TABLE review_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  original_text TEXT,
  final_text TEXT,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- =============================================================
-- 8. PRIVATE FEEDBACK
-- =============================================================
CREATE TABLE private_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  contact_name TEXT,
  contact_value TEXT,
  contact_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- 9. EVENTS (append-only)
-- =============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  campaign_id UUID,
  business_id UUID,
  event_type TEXT NOT NULL,
  client_event_id UUID,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_event_id)
);

-- =============================================================
-- 10. SESSION FLAGS
-- =============================================================
CREATE TABLE session_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  business_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- INDEXES (composite for tenant-scoped queries)
-- =============================================================
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_campaigns_business ON campaigns(business_id);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_menu_items_business ON menu_items(business_id);
CREATE INDEX idx_questions_business ON questions(business_id);
CREATE INDEX idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX idx_sessions_business ON sessions(business_id);
CREATE INDEX idx_sessions_business_created ON sessions(business_id, created_at);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_answers_session ON answers(session_id);
CREATE INDEX idx_answers_question_key ON answers(question_key);
CREATE INDEX idx_review_drafts_session ON review_drafts(session_id);
CREATE INDEX idx_private_feedback_business ON private_feedback(business_id);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_business ON events(business_id);
CREATE INDEX idx_events_business_type ON events(business_id, event_type);
CREATE INDEX idx_events_type_timestamp ON events(event_type, timestamp);
CREATE INDEX idx_session_flags_session ON session_flags(session_id);
CREATE INDEX idx_session_flags_business ON session_flags(business_id);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Enable RLS on ALL tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_flags ENABLE ROW LEVEL SECURITY;

-- === OWNER POLICIES (authenticated users via Supabase Auth) ===

-- businesses: owner CRUD
CREATE POLICY "businesses_owner_select" ON businesses
  FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "businesses_owner_insert" ON businesses
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "businesses_owner_update" ON businesses
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- campaigns: owner CRUD via business ownership
CREATE POLICY "campaigns_owner_select" ON campaigns
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "campaigns_owner_insert" ON campaigns
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "campaigns_owner_update" ON campaigns
  FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

CREATE POLICY "campaigns_owner_delete" ON campaigns
  FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

-- menu_items: owner CRUD
CREATE POLICY "menu_items_owner_all" ON menu_items
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

-- questions: owner CRUD
CREATE POLICY "questions_owner_all" ON questions
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

-- sessions: owner can READ (writes are via service-role)
CREATE POLICY "sessions_owner_select" ON sessions
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

-- answers: owner can READ
CREATE POLICY "answers_owner_select" ON answers
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM sessions WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())
    )
  ));

-- review_drafts: owner can READ
CREATE POLICY "review_drafts_owner_select" ON review_drafts
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM sessions WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())
    )
  ));

-- private_feedback: owner can READ
CREATE POLICY "private_feedback_owner_select" ON private_feedback
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

-- events: owner can READ
CREATE POLICY "events_owner_select" ON events
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

-- session_flags: owner can READ
CREATE POLICY "session_flags_owner_select" ON session_flags
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())));

-- === ANON POLICIES ===
-- NONE. Anonymous users have ZERO direct table access.
-- All customer writes go through server-side API routes using the service-role key.
-- The service-role key bypasses RLS entirely.

-- =============================================================
-- HELPER FUNCTION: seed default questions for a new business
-- =============================================================
CREATE OR REPLACE FUNCTION seed_default_questions(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO questions (business_id, key, type, text, required, position, active) VALUES
    (p_business_id, 'overall_rating', 'rating',
     '{"en": "How was your overall experience?"}'::jsonb, true, 1, true),
    (p_business_id, 'food_rating', 'rating',
     '{"en": "How was the food?"}'::jsonb, true, 2, true),
    (p_business_id, 'service_rating', 'rating',
     '{"en": "How was the service?"}'::jsonb, true, 3, true),
    (p_business_id, 'liked', 'multi_choice',
     '{"en": "What did you like?"}'::jsonb, false, 4, true),
    (p_business_id, 'ordered', 'multi_choice',
     '{"en": "What did you order?"}'::jsonb, false, 5, true),
    (p_business_id, 'comment', 'text',
     '{"en": "Anything else you''d like to share?"}'::jsonb, false, 6, false),
    (p_business_id, 'return_intent', 'single_choice',
     '{"en": "Would you visit again?"}'::jsonb, false, 7, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- HELPER FUNCTION: generate random slug
-- =============================================================
CREATE OR REPLACE FUNCTION generate_random_slug(length INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- TRIGGER: updated_at auto-update
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER review_drafts_updated_at
  BEFORE UPDATE ON review_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
