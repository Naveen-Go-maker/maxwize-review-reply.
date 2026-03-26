-- ReviewReply Database Schema
-- Migration: 001_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE plan_type AS ENUM ('free', 'pro', 'business');
CREATE TYPE response_status AS ENUM ('draft', 'approved', 'posted', 'skipped');
CREATE TYPE tone_type AS ENUM ('warm', 'professional', 'casual', 'empathetic');
CREATE TYPE language_code AS ENUM ('en', 'hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn');
CREATE TYPE email_frequency AS ENUM ('immediate', 'negative_only', 'daily_digest');

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  plan plan_type NOT NULL DEFAULT 'free',
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_account_id TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_subscription_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS TABLE
-- ============================================================

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  google_location_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, google_location_id)
);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  google_review_id TEXT NOT NULL UNIQUE,
  reviewer_name TEXT NOT NULL,
  reviewer_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  review_language TEXT DEFAULT 'en',
  google_created_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, google_review_id)
);

-- ============================================================
-- RESPONSES TABLE
-- ============================================================

CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  variant_number INTEGER NOT NULL CHECK (variant_number >= 1 AND variant_number <= 3),
  text TEXT NOT NULL,
  status response_status NOT NULL DEFAULT 'draft',
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, variant_number)
);

-- ============================================================
-- BRAND VOICE TABLE
-- ============================================================

CREATE TABLE public.brand_voice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  tone tone_type NOT NULL DEFAULT 'professional',
  language language_code NOT NULL DEFAULT 'en',
  owner_name TEXT,
  sign_off TEXT,
  custom_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL location_id means global setting for user
  UNIQUE(user_id, location_id)
);

-- ============================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================

CREATE TABLE public.notification_prefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_frequency email_frequency NOT NULL DEFAULT 'immediate',
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_number TEXT,
  weekly_summary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USAGE LOG TABLE
-- ============================================================

CREATE TABLE public.usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  ai_replies_used INTEGER NOT NULL DEFAULT 0,
  reviews_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX idx_users_google_account ON public.users(google_account_id);

-- Locations
CREATE INDEX idx_locations_user_id ON public.locations(user_id);
CREATE INDEX idx_locations_google_id ON public.locations(google_location_id);
CREATE INDEX idx_locations_active ON public.locations(user_id, is_active);

-- Reviews
CREATE INDEX idx_reviews_location_id ON public.reviews(location_id);
CREATE INDEX idx_reviews_google_id ON public.reviews(google_review_id);
CREATE INDEX idx_reviews_rating ON public.reviews(location_id, rating);
CREATE INDEX idx_reviews_created ON public.reviews(google_created_at DESC);
CREATE INDEX idx_reviews_synced ON public.reviews(synced_at DESC);

-- Responses
CREATE INDEX idx_responses_review_id ON public.responses(review_id);
CREATE INDEX idx_responses_status ON public.responses(status);

-- Brand Voice
CREATE INDEX idx_brand_voice_user_id ON public.brand_voice(user_id);
CREATE INDEX idx_brand_voice_location_id ON public.brand_voice(location_id);

-- Usage Log
CREATE INDEX idx_usage_log_user_month ON public.usage_log(user_id, month);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role');

-- Locations policies
CREATE POLICY "Users can view own locations"
  ON public.locations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own locations"
  ON public.locations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own locations"
  ON public.locations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own locations"
  ON public.locations FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all locations"
  ON public.locations FOR ALL
  USING (auth.role() = 'service_role');

-- Reviews policies
CREATE POLICY "Users can view reviews for own locations"
  ON public.reviews FOR SELECT
  USING (
    location_id IN (
      SELECT id FROM public.locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reviews for own locations"
  ON public.reviews FOR INSERT
  WITH CHECK (
    location_id IN (
      SELECT id FROM public.locations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all reviews"
  ON public.reviews FOR ALL
  USING (auth.role() = 'service_role');

-- Responses policies
CREATE POLICY "Users can view responses for own reviews"
  ON public.responses FOR SELECT
  USING (
    review_id IN (
      SELECT r.id FROM public.reviews r
      JOIN public.locations l ON r.location_id = l.id
      WHERE l.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert responses for own reviews"
  ON public.responses FOR INSERT
  WITH CHECK (
    review_id IN (
      SELECT r.id FROM public.reviews r
      JOIN public.locations l ON r.location_id = l.id
      WHERE l.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own responses"
  ON public.responses FOR UPDATE
  USING (
    review_id IN (
      SELECT r.id FROM public.reviews r
      JOIN public.locations l ON r.location_id = l.id
      WHERE l.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all responses"
  ON public.responses FOR ALL
  USING (auth.role() = 'service_role');

-- Brand voice policies
CREATE POLICY "Users can view own brand voice"
  ON public.brand_voice FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own brand voice"
  ON public.brand_voice FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own brand voice"
  ON public.brand_voice FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own brand voice"
  ON public.brand_voice FOR DELETE
  USING (user_id = auth.uid());

-- Notification prefs policies
CREATE POLICY "Users can view own notification prefs"
  ON public.notification_prefs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification prefs"
  ON public.notification_prefs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification prefs"
  ON public.notification_prefs FOR UPDATE
  USING (user_id = auth.uid());

-- Usage log policies
CREATE POLICY "Users can view own usage"
  ON public.usage_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all usage"
  ON public.usage_log FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brand_voice_updated_at
  BEFORE UPDATE ON public.brand_voice
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_prefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usage_log_updated_at
  BEFORE UPDATE ON public.usage_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment AI replies usage
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
DECLARE
  v_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO public.usage_log (user_id, month, ai_replies_used)
  VALUES (p_user_id, v_month, p_count)
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    ai_replies_used = usage_log.ai_replies_used + p_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.notification_prefs (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.brand_voice (user_id, location_id)
  VALUES (NEW.id, NULL)
  ON CONFLICT (user_id, location_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
