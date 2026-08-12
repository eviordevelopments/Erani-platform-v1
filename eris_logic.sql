-- ═══════════════════════════════════════════════════════════════════════════
-- ERIS LOGIC — Database Schema Updates & Procedures
-- ERANI Platform v1
-- ═══════════════════════════════════════════════════════════════════════════
-- This file contains all database changes required to support the ERIS credit
-- system as described in eris_logic.md:
--   • 20 ERIS trial on account creation (not 100)
--   • Freeze at 0 ERIS (can't create audits/projects/agent queries)
--   • Post-Stripe purchase: generate a unique access code (XXXX-XXXX-XXXX)
--   • Store access code linked to org (not user profile)
--   • Validate code → activate 100 ERIS for all org members
--   • Set paid_subscription = true on organization
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: Add paid_subscription + trial flags to organizations table
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS paid_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_activated_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS eris_balance INTEGER NOT NULL DEFAULT 20;
-- NOTE: eris_balance at the org level tracks the shared pool.
--       Individual profiles still have their own eris_balance for display,
--       but consumption is validated against the org pool.


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: Ensure profile eris_balance defaults to 20 (trial), not 100
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ALTER COLUMN eris_balance SET DEFAULT 20;

-- Reset any existing trial accounts that were set to 100 (non-paid)
-- IMPORTANT: Only resets accounts where the org does NOT have paid_subscription=true
-- Run this carefully in production — only affects orgs not yet activated
UPDATE profiles p
SET eris_balance = 20
FROM organizations o
WHERE p.organization_id = o.id
  AND o.paid_subscription = FALSE
  AND p.eris_balance = 100;

-- Also reset org-level eris_balance for non-paid orgs
UPDATE organizations
SET eris_balance = 20
WHERE paid_subscription = FALSE
  AND eris_balance = 100;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3: Create the access_codes table
-- This is linked to organizations (not individual profiles).
-- The admin of the org receives the code via email and validates it.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_codes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code             TEXT NOT NULL UNIQUE,          -- e.g. "K9X2-R7WB-4M6P"
  stripe_session_id TEXT DEFAULT NULL,            -- Stripe checkout session ID for traceability
  used             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at     TIMESTAMPTZ DEFAULT NULL
);

-- Index for fast lookup by org
CREATE INDEX IF NOT EXISTS idx_access_codes_org_id   ON access_codes(organization_id);
-- Index for fast lookup by code string
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 4: Row Level Security for access_codes
-- Only the org's admin member can view their org's code.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Members of the org can view (to validate the code on the UI)
CREATE POLICY "Org members can view their access code"
  ON access_codes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only service_role / admin can insert (done via API with supabaseAdmin)
-- No public INSERT policy — code generation is backend-only via supabaseAdmin


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 5: Function to validate an access code and activate subscription
-- Validates that the input code matches the org's code, then:
--   • Marks code as used
--   • Sets organizations.paid_subscription = true
--   • Sets organizations.eris_balance = 100
--   • Updates ALL profiles in that org to eris_balance = 100
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_access_code(
  p_org_id   UUID,
  p_code     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as the function owner (service role), bypasses RLS
AS $$
DECLARE
  v_code_record  access_codes%ROWTYPE;
  v_result       JSONB;
BEGIN
  -- Look up the code for this org
  SELECT * INTO v_code_record
  FROM access_codes
  WHERE organization_id = p_org_id
    AND code = UPPER(p_code)
    AND used = FALSE
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Código inválido o ya utilizado'
    );
  END IF;

  -- Mark code as used and record validation timestamp
  UPDATE access_codes
  SET used = TRUE, validated_at = NOW()
  WHERE id = v_code_record.id;

  -- Activate org subscription and update ERIS balance
  UPDATE organizations
  SET
    paid_subscription        = TRUE,
    subscription_activated_at = NOW(),
    eris_balance             = 100,
    plan                     = 'beta'
  WHERE id = p_org_id;

  -- Update ALL profiles belonging to this org
  UPDATE profiles
  SET eris_balance = 100
  WHERE organization_id = p_org_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Suscripción ERANI Beta activada correctamente'
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 6: Function to generate and store an access code
-- Called from the backend API after Stripe payment is confirmed.
-- Generates a code in format XXXX-XXXX-XXXX (uppercase alphanumeric).
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_access_code(
  p_org_id           UUID,
  p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No 0/O/1/I to avoid confusion
  v_code   TEXT;
  v_part   TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Generate unique code with retry loop (collision is extremely unlikely)
  LOOP
    v_code := '';
    -- Build 3 sections of 4 chars each, joined by hyphens
    FOR i IN 1..3 LOOP
      v_part := '';
      FOR j IN 1..4 LOOP
        v_part := v_part || substr(v_chars, floor(random() * length(v_chars) + 1)::INT, 1);
      END LOOP;
      IF i < 3 THEN
        v_code := v_code || v_part || '-';
      ELSE
        v_code := v_code || v_part;
      END IF;
    END LOOP;

    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM access_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  -- Invalidate any previous unused codes for this org (safety: only one active code at a time)
  UPDATE access_codes
  SET used = TRUE
  WHERE organization_id = p_org_id AND used = FALSE;

  -- Store the new code
  INSERT INTO access_codes (organization_id, code, stripe_session_id)
  VALUES (p_org_id, v_code, p_stripe_session_id);

  RETURN v_code;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 7: Trigger — initialize new profiles with 20 ERIS trial
-- Ensures every new profile created gets exactly 20 ERIS regardless of
-- any client-side overrides.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION init_profile_eris()
RETURNS TRIGGER AS $$
BEGIN
  -- Enforce 20 ERIS trial for all new profiles
  NEW.eris_balance := 20;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if already exists, then recreate
DROP TRIGGER IF EXISTS trg_init_profile_eris ON profiles;
CREATE TRIGGER trg_init_profile_eris
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION init_profile_eris();


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 8: Trigger — initialize new organizations with 20 ERIS trial
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION init_org_eris()
RETURNS TRIGGER AS $$
BEGIN
  NEW.eris_balance       := 20;
  NEW.paid_subscription  := FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_init_org_eris ON organizations;
CREATE TRIGGER trg_init_org_eris
  BEFORE INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION init_org_eris();


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 9: Grant execute permissions on functions to authenticated users
-- The actual execution from API routes uses service role, but the validate
-- function is callable from the client via RPC with auth context.
-- ─────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION validate_access_code(UUID, TEXT) TO authenticated;
-- generate_access_code is backend-only, NOT granted to anon/authenticated
GRANT EXECUTE ON FUNCTION generate_access_code(UUID, TEXT) TO service_role;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 10: Allow org members to update their own org (for the validate flow
-- where we update paid_subscription via RPC / SECURITY DEFINER function)
-- The actual org update happens inside validate_access_code (SECURITY DEFINER)
-- so no direct UPDATE policy is needed on organizations from authenticated users.
-- ─────────────────────────────────────────────────────────────────────────

-- Allow org admin to read their own org's access code record
-- (Already covered by policy in STEP 4)

-- ─────────────────────────────────────────────────────────────────────────
-- SUMMARY OF CHANGES
-- ─────────────────────────────────────────────────────────────────────────
-- Table changes:
--   organizations: + paid_subscription (bool), + subscription_activated_at, + eris_balance (int, default 20)
--   profiles:        eris_balance default changed from 100 to 20
--   access_codes:    NEW TABLE (id, organization_id, code, stripe_session_id, used, created_at, validated_at)
--
-- Functions:
--   generate_access_code(org_id, stripe_session_id) → TEXT  [service_role only]
--   validate_access_code(org_id, code)              → JSONB [authenticated]
--
-- Triggers:
--   trg_init_profile_eris  → enforces 20 ERIS on INSERT to profiles
--   trg_init_org_eris      → enforces 20 ERIS + paid=false on INSERT to organizations
