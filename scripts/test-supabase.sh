#!/usr/bin/env bash
# =============================================================
# ERANI Platform — Supabase Connection Test Script
# Run from the project root: chmod +x scripts/test-supabase.sh && ./scripts/test-supabase.sh
# =============================================================

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://ctgizovelvkzahbmxwgc.supabase.co}"
ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ERANI — Supabase Connection Test"
echo "  Project: ctgizovelvkzahbmxwgc"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─────────────────────────────────────────────
# TEST 1: Supabase REST API reachability (anon key)
# ─────────────────────────────────────────────
echo ""
echo "▶ TEST 1: REST API — organizations table (anon key)"
curl -s -w "\nHTTP Status: %{http_code} | Time: %{time_total}s\n" \
  "${SUPABASE_URL}/rest/v1/organizations?select=id,name&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || cat

# ─────────────────────────────────────────────
# TEST 2: Admin query using service_role key (bypasses RLS)
# ─────────────────────────────────────────────
echo ""
echo "▶ TEST 2: REST API — organizations table (service_role key)"
curl -s -w "\nHTTP Status: %{http_code} | Time: %{time_total}s\n" \
  "${SUPABASE_URL}/rest/v1/organizations?select=*&limit=5" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || cat

# ─────────────────────────────────────────────
# TEST 3: Supabase Auth API (check project is alive)
# ─────────────────────────────────────────────
echo ""
echo "▶ TEST 3: Auth API — settings endpoint"
curl -s -w "\nHTTP Status: %{http_code} | Time: %{time_total}s\n" \
  "${SUPABASE_URL}/auth/v1/settings" \
  -H "apikey: ${ANON_KEY}" \
  | python3 -m json.tool 2>/dev/null || cat

# ─────────────────────────────────────────────
# TEST 4: Next.js local API health check
# ─────────────────────────────────────────────
echo ""
echo "▶ TEST 4: Next.js /api/health (local dev server)"
curl -s -w "\nHTTP Status: %{http_code} | Time: %{time_total}s\n" \
  "http://localhost:3000/api/health" \
  | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done. Check results above."
echo "  If TEST 1-3 show 'relation does not exist',"
echo "  run supabase_schema.sql in the SQL Editor first."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
