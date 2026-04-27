-- ============================================================
-- ERANI Platform v1 — Enhanced Organization & Settings Tables
-- ============================================================

-- 1. EXTEND ORGANIZATIONS TABLE
-- Assuming organizations table exists, we add the new fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS team_size TEXT, -- e.g. "1-10", "11-50", "50+"
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT[], -- Array of strings
ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_email TEXT,
ADD COLUMN IF NOT EXISTS eris_balance INTEGER DEFAULT 1000;

-- 2. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS team_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'member', -- member, admin, viewer
  status          TEXT DEFAULT 'pending', -- pending, active, expired
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  joined_at       TIMESTAMPTZ,
  UNIQUE(organization_id, email)
);

-- 3. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_email  TEXT NOT NULL,
  referral_code   TEXT UNIQUE NOT NULL,
  status          TEXT DEFAULT 'pending', -- pending, converted, rewards_paid
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORGANIZATION SETTINGS (Feature Toggles)
CREATE TABLE IF NOT EXISTS organization_features (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  firewall_enabled    BOOLEAN DEFAULT true,
  email_alerts        BOOLEAN DEFAULT true,
  slack_alerts        BOOLEAN DEFAULT false,
  auto_audit          BOOLEAN DEFAULT false,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified)
CREATE POLICY "Org members can manage team"
  ON team_members FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can see their referrals"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid());

CREATE POLICY "Org members can toggle features"
  ON organization_features FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
