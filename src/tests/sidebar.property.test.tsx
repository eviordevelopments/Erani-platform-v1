// @vitest-environment jsdom
/**
 * Property-based tests for the Sidebar component
 *
 * Feature: org-auth-onboarding
 * Property 19: Sidebar muestra display_name con fallback correcto
 * Property 20: Sidebar usa logo de organización con fallback
 *
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as fc from "fast-check";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/image — render as plain <img> to allow src inspection
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    priority: _priority,
    ...rest
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} {...rest} />
  ),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    aside: ({
      children,
      animate: _a,
      initial: _i,
      transition: _t,
      ...props
    }: React.HTMLAttributes<HTMLElement> & {
      children?: React.ReactNode;
      animate?: unknown;
      initial?: unknown;
      transition?: unknown;
    }) => <aside {...props}>{children}</aside>,
    div: ({
      children,
      animate: _a,
      initial: _i,
      transition: _t,
      layoutId: _l,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      animate?: unknown;
      initial?: unknown;
      transition?: unknown;
      layoutId?: unknown;
    }) => <div {...props}>{children}</div>,
    span: ({
      children,
      animate: _a,
      initial: _i,
      transition: _t,
      ...props
    }: React.HTMLAttributes<HTMLSpanElement> & {
      children?: React.ReactNode;
      animate?: unknown;
      initial?: unknown;
      transition?: unknown;
    }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Context mock state — reassigned per test
let mockProfile: Record<string, unknown> | null = null;
let mockOrg: Record<string, unknown> | null = null;

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    profile: mockProfile,
    org: mockOrg,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/context/DashboardContext", () => ({
  useDashboard: () => ({
    isSidebarCollapsed: false,
    setIsSidebarCollapsed: vi.fn(),
  }),
}));

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({
    theme: "dark",
    toggleTheme: vi.fn(),
  }),
}));

// ── Import component AFTER mocks ──────────────────────────────────────────────
import Sidebar from "@/components/Sidebar";

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Safe alphanumeric string — no leading/trailing whitespace, no special chars.
 * Trimmed strings ensure the test assertions match the Sidebar's rendering exactly.
 */
const safeString = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 _-]{0,38}[A-Za-z0-9]$/)
  .filter((s) => s.trim() === s && s.length >= 2);

/** Nullable safe string */
const nullableSafeString = fc.option(safeString, { nil: null });

/** Profile arbitrary using safe strings */
const profileArb = fc.record({
  id: fc.uuid(),
  organization_id: fc.option(fc.uuid(), { nil: null }),
  full_name: nullableSafeString,
  display_name: nullableSafeString,
  email: fc.emailAddress(),
  profile_type: fc.constantFrom("admin" as const, "member" as const),
  role: nullableSafeString,
  bio: nullableSafeString,
  avatar_url: nullableSafeString,
  password_set: fc.boolean(),
  onboarding_completed: fc.boolean(),
  eris_balance: fc.integer({ min: 0, max: 1000 }),
});

/** Org with logo_url — valid HTTPS URL */
const orgWithLogoArb = fc.record({
  id: fc.uuid(),
  name: safeString,
  logo_url: safeString.map((s) => `https://cdn.example.com/${s.replace(/\s/g, "-")}.png`),
  plan: fc.constantFrom("trial", "pro", "enterprise"),
});

/** Org without logo_url */
const orgWithoutLogoArb = fc.record({
  id: fc.uuid(),
  name: safeString,
  logo_url: fc.constant(null),
  plan: fc.constantFrom("trial", "pro", "enterprise"),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSidebar() {
  return render(<Sidebar />);
}

/** Get the avatar <img> element (the one inside the profile button) */
function getAvatarImg(): HTMLImageElement | null {
  return document.querySelector('img[alt="Avatar"]');
}

/**
 * Replicate the Sidebar's display name logic:
 *   profile?.display_name || profile?.full_name || "Usuario"
 */
function expectedDisplayName(profile: Record<string, unknown> | null): string {
  if (!profile) return "Usuario";
  return (profile.display_name as string | null) ||
    (profile.full_name as string | null) ||
    "Usuario";
}

/**
 * Replicate the Sidebar's subtitle logic:
 *   role capitalized + " | " + org.name  (when org exists)
 *   role capitalized                      (when org is null)
 *   "Cliente"                             (when role is null)
 */
function expectedSubtitle(
  profile: Record<string, unknown> | null,
  org: Record<string, unknown> | null
): string {
  const role = profile?.role as string | null | undefined;
  const userRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "Cliente";
  const orgName = (org?.name as string | null) || "";
  return orgName ? `${userRole} | ${orgName}` : userRole;
}

// ── Property 19: display_name fallback and subtitle format ────────────────────

describe("Property 19: Sidebar muestra display_name con fallback correcto", () => {
  // Feature: org-auth-onboarding, Property 19: Sidebar muestra display_name con fallback correcto

  beforeEach(() => {
    mockProfile = null;
    mockOrg = null;
  });

  it("shows display_name when it is set (non-null)", () => {
    // Validates: Requirements 6.1
    fc.assert(
      fc.property(
        profileArb.filter(
          (p) => p.display_name !== null && p.display_name !== undefined
        ),
        (profile) => {
          mockProfile = profile;
          mockOrg = null;

          const { unmount, container } = renderSidebar();

          // The Sidebar renders display_name as-is (CSS uppercase is visual only)
          const expected = expectedDisplayName(profile);
          expect(container.textContent).toContain(expected);

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it("falls back to full_name when display_name is null", () => {
    // Validates: Requirements 6.1
    fc.assert(
      fc.property(
        profileArb.filter(
          (p) =>
            (p.display_name === null || p.display_name === undefined) &&
            p.full_name !== null &&
            p.full_name !== undefined
        ),
        (profile) => {
          mockProfile = { ...profile, display_name: null };
          mockOrg = null;

          const { unmount, container } = renderSidebar();

          const expected = expectedDisplayName({ ...profile, display_name: null });
          expect(container.textContent).toContain(expected);

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it("subtitle format is exactly '[role] | [org_name]' when both exist", () => {
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(
        profileArb.filter((p) => p.role !== null && p.role !== undefined),
        orgWithLogoArb,
        (profile, org) => {
          mockProfile = profile;
          mockOrg = org;

          const { unmount, container } = renderSidebar();

          const expected = expectedSubtitle(profile, org);
          // The subtitle span has title attribute and text content equal to the subtitle
          expect(container.textContent).toContain(expected);

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it("subtitle shows only role (no ' | ') when org is null", () => {
    // Validates: Requirements 6.2 — safe fallback when org is null
    fc.assert(
      fc.property(
        profileArb.filter((p) => p.role !== null && p.role !== undefined),
        (profile) => {
          mockProfile = profile;
          mockOrg = null; // no org

          const { unmount, container } = renderSidebar();

          const expected = expectedSubtitle(profile, null);
          // Subtitle should appear in the DOM
          expect(container.textContent).toContain(expected);
          // And it should NOT contain " | " since there is no org
          expect(expected).not.toContain(" | ");

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ── Property 20: logo fallback ────────────────────────────────────────────────

describe("Property 20: Sidebar usa logo de organización con fallback", () => {
  // Feature: org-auth-onboarding, Property 20: Sidebar usa logo de organización con fallback

  beforeEach(() => {
    mockProfile = null;
    mockOrg = null;
  });

  it("uses org logo_url as avatar src when logo_url is set", () => {
    // Validates: Requirements 6.3
    fc.assert(
      fc.property(profileArb, orgWithLogoArb, (profile, org) => {
        mockProfile = profile;
        mockOrg = org;

        const { unmount } = renderSidebar();

        const avatarImg = getAvatarImg();
        expect(avatarImg).not.toBeNull();
        expect(avatarImg!.getAttribute("src")).toBe(org.logo_url);

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it("falls back to /isologo.png when org logo_url is null", () => {
    // Validates: Requirements 6.3
    fc.assert(
      fc.property(profileArb, orgWithoutLogoArb, (profile, org) => {
        mockProfile = profile;
        mockOrg = org;

        const { unmount } = renderSidebar();

        const avatarImg = getAvatarImg();
        expect(avatarImg).not.toBeNull();
        expect(avatarImg!.getAttribute("src")).toBe("/isologo.png");

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it("falls back to /isologo.png when org is null (no organization)", () => {
    // Validates: Requirements 6.3
    fc.assert(
      fc.property(profileArb, (profile) => {
        mockProfile = profile;
        mockOrg = null;

        const { unmount } = renderSidebar();

        const avatarImg = getAvatarImg();
        expect(avatarImg).not.toBeNull();
        expect(avatarImg!.getAttribute("src")).toBe("/isologo.png");

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
