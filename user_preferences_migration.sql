-- ============================================================
-- ERANI Platform v1 — User Preferences Migration
-- Creates or migrates user_preferences for per-user preferences
--
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ============================================================

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  font_size       INTEGER DEFAULT 16,
  theme_color     TEXT DEFAULT '#0055A0',
  custom_logo_url TEXT,
  bento_order     TEXT[] DEFAULT ARRAY['sankey', 'dark-data', 'scope-creep', 'alerts'],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure columns exist if table was already created by an older script
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS bento_order TEXT[] DEFAULT ARRAY['sankey', 'dark-data', 'scope-creep', 'alerts'];

-- 3. Fix Constraints: Drop old organization_id unique constraint if it exists
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_organization_id_key;

-- 4. Add unique constraint on user_id to ensure 1:1 mapping per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_user_id_key'
  ) THEN
    ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 5. RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view preferences" ON user_preferences;
DROP POLICY IF EXISTS "Org members can update preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid());

-- 6. Trigger for updated_at (assumes update_updated_at() exists from base schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
