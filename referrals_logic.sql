-- ═══════════════════════════════════════════════════════════════════════════
-- ERANI Platform v1 - REFERRAL SYSTEM LOGIC
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure an org only has one active referral code
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_codes_org_id ON referral_codes(referrer_org_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- 2. Create referral_redemptions table to track who redeemed what
CREATE TABLE IF NOT EXISTS referral_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redeemed_by_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE, -- One redemption per org ever
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view referral codes"
  ON referral_codes FOR SELECT USING (true);

CREATE POLICY "Org members can insert their own code"
  ON referral_codes FOR INSERT 
  WITH CHECK (
    referrer_org_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can view their own redemptions"
  ON referral_redemptions FOR SELECT
  USING (
    redeemed_by_org_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 3. The secure RPC function to redeem a code
-- It will automatically add 20 ERIS to the redeemer and 100 ERIS to the referrer.
CREATE OR REPLACE FUNCTION redeem_referral_code(
  p_code TEXT,
  p_org_id UUID
) RETURNS JSON AS $$
DECLARE
  v_ref_code_id UUID;
  v_referrer_org_id UUID;
  v_already_redeemed BOOLEAN;
BEGIN
  -- Validate the organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_org_id) THEN
    RETURN json_build_object('success', false, 'error', 'Organización no encontrada.');
  END IF;

  -- Verify the organization hasn't already redeemed a code
  SELECT EXISTS (
    SELECT 1 FROM referral_redemptions WHERE redeemed_by_org_id = p_org_id
  ) INTO v_already_redeemed;

  IF v_already_redeemed THEN
    RETURN json_build_object('success', false, 'error', 'Tu organización ya ha canjeado un código de referido anteriormente.');
  END IF;

  -- Find the referral code
  SELECT id, referrer_org_id INTO v_ref_code_id, v_referrer_org_id
  FROM referral_codes
  WHERE code = p_code;

  IF v_ref_code_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código de referido inválido o no existe.');
  END IF;

  -- Prevent self-redemption
  IF v_referrer_org_id = p_org_id THEN
    RETURN json_build_object('success', false, 'error', 'No puedes canjear tu propio código de referido.');
  END IF;

  -- Register redemption
  INSERT INTO referral_redemptions (redeemed_by_org_id, referral_code_id)
  VALUES (p_org_id, v_ref_code_id);

  -- Add 20 ERIS to redeemer
  UPDATE organizations
  SET eris_balance = eris_balance + 20
  WHERE id = p_org_id;

  -- Add 100 ERIS to referrer
  UPDATE organizations
  SET eris_balance = eris_balance + 100
  WHERE id = v_referrer_org_id;

  RETURN json_build_object('success', true, 'message', 'Código canjeado con éxito. ¡20 ERIS agregados a tu cuenta y 100 ERIS a tu colega!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
