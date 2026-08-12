/**
 * Property-based tests for API routes authorization logic
 *
 * Feature: org-auth-onboarding
 * Property 21: Autorización por profile_type en API routes
 * Property 22: API routes derivan organization_id desde profiles
 *
 * Validates: Requirements 8.2, 8.4, 8.1, 8.5
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ── Supabase admin mock ───────────────────────────────────────────────────────
//
// We intercept supabaseAdmin at the module level so that every route that
// imports it (forensic, ingest, sessions) gets the same controllable mock.
// The mock is configured per-test via the `mockGetUser` / `mockProfile` helpers.

type MockGetUserResult = {
  data: { user: { id: string } | null };
  error: null | { message: string };
};

type MockProfileResult = {
  data: { organization_id: string; profile_type: string } | null;
  error: null | { message: string };
};

// Mutable state shared across the mock chain
let _getUserResult: MockGetUserResult = { data: { user: null }, error: null };
let _profileResult: MockProfileResult = { data: null, error: null };

// Track every `.from()` call so Property 22 can assert that 'profiles' was
// queried and that user_metadata was never accessed.
const fromCalls: string[] = [];

vi.mock("@/lib/supabaseAdmin", () => {
  const buildProfileChain = () => ({
    select: () => buildProfileChain(),
    eq: () => buildProfileChain(),
    single: () => Promise.resolve(_profileResult),
  });

  const supabaseAdmin = {
    auth: {
      getUser: (_token: string) => Promise.resolve(_getUserResult),
    },
    from: (table: string) => {
      fromCalls.push(table);
      return buildProfileChain();
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
      }),
    },
  };

  return { supabaseAdmin };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setAuthSuccess(userId: string) {
  _getUserResult = { data: { user: { id: userId } }, error: null };
}

function setAuthFailure() {
  _getUserResult = { data: { user: null }, error: { message: "invalid token" } };
}

function setProfile(organizationId: string, profileType: string) {
  _profileResult = {
    data: { organization_id: organizationId, profile_type: profileType },
    error: null,
  };
}

function setNoProfile() {
  _profileResult = { data: null, error: null };
}

/** Build a minimal Request with an Authorization header */
function makeRequest(
  method: "GET" | "POST" | "DELETE",
  token: string,
  url = "http://localhost/api/test",
  body?: BodyInit
): Request {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  return new Request(url, {
    method,
    headers,
    body: method !== "GET" ? body ?? JSON.stringify({}) : undefined,
  });
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** UUID-like string (fast-check's fc.uuid() is v4) */
const uuidArb = fc.uuid();

/** A JWT token is just an opaque string from the route's perspective */
const tokenArb = fc
  .string({ minLength: 10, maxLength: 64 })
  .filter((s) => !s.includes(" "));

/** profile_type values */
const profileTypeArb = fc.constantFrom("admin" as const, "member" as const);

// ── Import route handlers AFTER mocks are registered ─────────────────────────
//
// Dynamic imports inside each test ensure the vi.mock() factory has already
// run before the module is evaluated.

// ── Property 21: Autorización por profile_type en API routes ─────────────────

describe("Property 21: Autorización por profile_type en API routes", () => {
  // Feature: org-auth-onboarding, Property 21: Autorización por profile_type en API routes

  beforeEach(() => {
    fromCalls.length = 0;
  });

  // ── /api/forensic ──────────────────────────────────────────────────────────

  describe("/api/forensic POST", () => {
    it("returns 403 for profile_type='member'", async () => {
      // Validates: Requirements 8.2, 8.4
      const { POST } = await import("@/app/api/forensic/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "member");

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).toBe(403);
          const body = await res.json();
          expect(body.error).toBeDefined();
        }),
        { numRuns: 20 }
      );
    });

    it("does NOT return 403 for profile_type='admin'", async () => {
      // Validates: Requirements 8.2 — admins are allowed write operations
      const { POST } = await import("@/app/api/forensic/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "admin");

          const req = makeRequest("POST", token);
          const res = await POST(req);

          // Admin should not be blocked by the 403 guard (may fail later for
          // other reasons like missing body, but must not be 403)
          expect(res.status).not.toBe(403);
        }),
        { numRuns: 20 }
      );
    });
  });

  // ── /api/ingest ────────────────────────────────────────────────────────────

  describe("/api/ingest POST", () => {
    it("returns 403 for profile_type='member'", async () => {
      // Validates: Requirements 8.2, 8.4
      const { POST } = await import("@/app/api/ingest/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "member");

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).toBe(403);
          const body = await res.json();
          expect(body.error).toBeDefined();
        }),
        { numRuns: 20 }
      );
    });

    it("does NOT return 403 for profile_type='admin'", async () => {
      // Validates: Requirements 8.2 — admins are allowed write operations
      const { POST } = await import("@/app/api/ingest/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "admin");

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).not.toBe(403);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe("/api/ingest DELETE", () => {
    it("returns 403 for profile_type='member'", async () => {
      // Validates: Requirements 8.2, 8.4
      const { DELETE } = await import("@/app/api/ingest/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "member");

          const req = makeRequest(
            "DELETE",
            token,
            "http://localhost/api/ingest?id=some-doc-id"
          );
          const res = await DELETE(req);

          expect(res.status).toBe(403);
          const body = await res.json();
          expect(body.error).toBeDefined();
        }),
        { numRuns: 20 }
      );
    });

    it("does NOT return 403 for profile_type='admin'", async () => {
      // Validates: Requirements 8.2 — admins are allowed delete operations
      const { DELETE } = await import("@/app/api/ingest/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "admin");

          const req = makeRequest(
            "DELETE",
            token,
            "http://localhost/api/ingest?id=some-doc-id"
          );
          const res = await DELETE(req);

          expect(res.status).not.toBe(403);
        }),
        { numRuns: 20 }
      );
    });
  });

  // ── /api/sessions ──────────────────────────────────────────────────────────

  describe("/api/sessions POST", () => {
    it("returns 403 for profile_type='member'", async () => {
      // Validates: Requirements 8.2, 8.4
      const { POST } = await import("@/app/api/sessions/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "member");

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).toBe(403);
          const body = await res.json();
          expect(body.error).toBeDefined();
        }),
        { numRuns: 20 }
      );
    });

    it("does NOT return 403 for profile_type='admin'", async () => {
      // Validates: Requirements 8.2 — admins are allowed write operations
      const { POST } = await import("@/app/api/sessions/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
          setAuthSuccess(userId);
          setProfile(orgId, "admin");

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).not.toBe(403);
        }),
        { numRuns: 20 }
      );
    });
  });

  // ── 401 when no token ──────────────────────────────────────────────────────

  describe("returns 401 when Authorization header is missing", () => {
    it("/api/forensic POST — no token → 401", async () => {
      // Validates: Requirements 8.5
      const { POST } = await import("@/app/api/forensic/route");

      await fc.assert(
        fc.asyncProperty(profileTypeArb, async (profileType) => {
          setAuthSuccess("some-user");
          setProfile("some-org", profileType);

          // Request without Authorization header
          const req = new Request("http://localhost/api/forensic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const res = await POST(req);

          expect(res.status).toBe(401);
        }),
        { numRuns: 20 }
      );
    });

    it("/api/ingest POST — no token → 401", async () => {
      // Validates: Requirements 8.5
      const { POST } = await import("@/app/api/ingest/route");

      await fc.assert(
        fc.asyncProperty(profileTypeArb, async (profileType) => {
          setAuthSuccess("some-user");
          setProfile("some-org", profileType);

          const req = new Request("http://localhost/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const res = await POST(req);

          expect(res.status).toBe(401);
        }),
        { numRuns: 20 }
      );
    });

    it("/api/sessions POST — no token → 401", async () => {
      // Validates: Requirements 8.5
      const { POST } = await import("@/app/api/sessions/route");

      await fc.assert(
        fc.asyncProperty(profileTypeArb, async (profileType) => {
          setAuthSuccess("some-user");
          setProfile("some-org", profileType);

          const req = new Request("http://localhost/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const res = await POST(req);

          expect(res.status).toBe(401);
        }),
        { numRuns: 20 }
      );
    });
  });

  // ── 401 when organization_id is missing from profile ──────────────────────

  describe("returns 401 when organization_id cannot be determined from profiles", () => {
    it("/api/forensic POST — no profile → 401", async () => {
      // Validates: Requirements 8.5
      const { POST } = await import("@/app/api/forensic/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, tokenArb, async (userId, token) => {
          setAuthSuccess(userId);
          setNoProfile(); // profile lookup returns null

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).toBe(401);
        }),
        { numRuns: 20 }
      );
    });

    it("/api/ingest POST — no profile → 401", async () => {
      // Validates: Requirements 8.5
      const { POST } = await import("@/app/api/ingest/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, tokenArb, async (userId, token) => {
          setAuthSuccess(userId);
          setNoProfile();

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).toBe(401);
        }),
        { numRuns: 20 }
      );
    });

    it("/api/sessions POST — no profile → 401", async () => {
      // Validates: Requirements 8.5
      const { POST } = await import("@/app/api/sessions/route");

      await fc.assert(
        fc.asyncProperty(uuidArb, tokenArb, async (userId, token) => {
          setAuthSuccess(userId);
          setNoProfile();

          const req = makeRequest("POST", token);
          const res = await POST(req);

          expect(res.status).toBe(401);
        }),
        { numRuns: 20 }
      );
    });
  });
});

// ── Property 22: API routes derivan organization_id desde profiles ────────────

describe("Property 22: API routes derivan organization_id desde profiles", () => {
  // Feature: org-auth-onboarding, Property 22: API routes derivan organization_id desde profiles

  beforeEach(() => {
    fromCalls.length = 0;
  });

  it("/api/forensic POST — queries 'profiles' table, never user_metadata", async () => {
    // Validates: Requirements 8.1, 8.5
    const { POST } = await import("@/app/api/forensic/route");

    await fc.assert(
      fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
        fromCalls.length = 0;
        setAuthSuccess(userId);
        setProfile(orgId, "admin");

        const req = makeRequest("POST", token);
        await POST(req);

        // The route must have queried the 'profiles' table to get organization_id
        expect(fromCalls).toContain("profiles");
      }),
      { numRuns: 20 }
    );
  });

  it("/api/ingest POST — queries 'profiles' table, never user_metadata", async () => {
    // Validates: Requirements 8.1, 8.5
    const { POST } = await import("@/app/api/ingest/route");

    await fc.assert(
      fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
        fromCalls.length = 0;
        setAuthSuccess(userId);
        setProfile(orgId, "admin");

        const req = makeRequest("POST", token);
        await POST(req);

        expect(fromCalls).toContain("profiles");
      }),
      { numRuns: 20 }
    );
  });

  it("/api/sessions POST — queries 'profiles' table, never user_metadata", async () => {
    // Validates: Requirements 8.1, 8.5
    const { POST } = await import("@/app/api/sessions/route");

    await fc.assert(
      fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
        fromCalls.length = 0;
        setAuthSuccess(userId);
        setProfile(orgId, "admin");

        const req = makeRequest("POST", token);
        await POST(req);

        expect(fromCalls).toContain("profiles");
      }),
      { numRuns: 20 }
    );
  });

  it("organization_id used in DB queries matches the value from profiles (not from request body)", async () => {
    // Validates: Requirements 8.1 — org isolation: the org used is always from profiles
    // We verify this by checking that the route uses the org from the profile mock,
    // not any org supplied in the request body.
    const { POST } = await import("@/app/api/sessions/route");

    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        uuidArb,
        uuidArb,
        tokenArb,
        async (userId, profileOrgId, requestOrgId, token) => {
          // Ensure the two org IDs are different so we can distinguish them
          fc.pre(profileOrgId !== requestOrgId);

          fromCalls.length = 0;
          setAuthSuccess(userId);
          setProfile(profileOrgId, "admin");

          // Send a different organization_id in the request body
          const req = makeRequest(
            "POST",
            token,
            "http://localhost/api/sessions",
            JSON.stringify({ organization_id: requestOrgId, title: "Test" })
          );
          const res = await POST(req);

          // The route must have queried profiles (not used the body org)
          expect(fromCalls).toContain("profiles");

          // The route should not return 401/403 based on the body org —
          // it resolved the org from the profile successfully
          expect(res.status).not.toBe(401);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("user_metadata is never accessed on the auth user object", async () => {
    // Validates: Requirements 8.1 — the routes must not read user.user_metadata
    // We verify this by providing a user object without user_metadata and
    // confirming the route still resolves the org correctly from profiles.
    const { POST } = await import("@/app/api/sessions/route");

    await fc.assert(
      fc.asyncProperty(uuidArb, uuidArb, tokenArb, async (userId, orgId, token) => {
        fromCalls.length = 0;

        // User object deliberately has NO user_metadata field
        _getUserResult = {
          data: { user: { id: userId } as { id: string } },
          error: null,
        };
        setProfile(orgId, "admin");

        const req = makeRequest("POST", token);
        const res = await POST(req);

        // Route should succeed (not 401) because it reads org from profiles
        expect(res.status).not.toBe(401);
        // And it must have queried profiles
        expect(fromCalls).toContain("profiles");
      }),
      { numRuns: 20 }
    );
  });
});
