// @vitest-environment jsdom
/**
 * Unit tests for auxiliary UI components
 *
 * Feature: org-auth-onboarding
 * Validates: Requirements 2.1, 3.1, 10.4, 10.5, 10.6
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Import components ─────────────────────────────────────────────────────
import OnboardingProgressBar from "@/components/OnboardingProgressBar";
import PrivacyModal from "@/components/PrivacyModal";
import InfoTooltip from "@/components/InfoTooltip";
import DataTransparencyCard from "@/components/DataTransparencyCard";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

// ── OnboardingProgressBar ─────────────────────────────────────────────────
describe("OnboardingProgressBar", () => {
  it("renders exactly 5 step labels", () => {
    // Validates: Requirements 2.1, 10.5
    // Component renders "1. Organización" style labels (not "Nivel 1: Organización")
    render(<OnboardingProgressBar currentStep={1} completedSteps={[]} />);

    expect(screen.getByText(/1\.\s*Organización/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.\s*Entorno/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.\s*Equipo/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.\s*Cuenta/i)).toBeInTheDocument();
    expect(screen.getByText(/5\.\s*Listo/i)).toBeInTheDocument();
  });

  it("marks the active step with erani-blue styling", () => {
    render(<OnboardingProgressBar currentStep={2} completedSteps={[1]} />);

    // Active pill uses bg-erani-blue/15 class
    const pills = document.querySelectorAll(".rounded-full");
    const activePills = Array.from(pills).filter((el) =>
      el.className.includes("bg-erani-blue")
    );
    expect(activePills.length).toBeGreaterThanOrEqual(1);
  });

  it("marks completed steps with erani-purple styling", () => {
    render(<OnboardingProgressBar currentStep={3} completedSteps={[1, 2]} />);

    // Completed pills use bg-erani-purple/15 class
    const pills = document.querySelectorAll(".rounded-full");
    const completedPills = Array.from(pills).filter((el) =>
      el.className.includes("bg-erani-purple")
    );
    expect(completedPills.length).toBeGreaterThanOrEqual(2);
  });

  it("renders 4 connecting lines between 5 steps", () => {
    const { container } = render(
      <OnboardingProgressBar currentStep={1} completedSteps={[]} />
    );
    // Each connecting line uses h-px class (1px height connector)
    const lines = container.querySelectorAll(".h-px");
    expect(lines.length).toBe(4);
  });
});

// ── PrivacyModal ──────────────────────────────────────────────────────────
describe("PrivacyModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <PrivacyModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the modal with title when isOpen is true", () => {
    // Validates: Requirements 3.1, 10.4
    render(<PrivacyModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: /Política de Privacidad/i })).toBeInTheDocument();
  });

  it("has role=dialog and aria-modal=true for accessibility", () => {
    render(<PrivacyModal isOpen={true} onClose={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders a close button (X icon)", () => {
    render(<PrivacyModal isOpen={true} onClose={() => {}} />);

    const closeButton = screen.getByLabelText(/Cerrar política de privacidad/i);
    expect(closeButton).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<PrivacyModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText(/Cerrar política de privacidad/i);
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", () => {
    const onClose = vi.fn();
    render(<PrivacyModal isOpen={true} onClose={onClose} />);

    // The overlay is the div with aria-hidden=true
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders privacy policy content sections", () => {
    render(<PrivacyModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/Información que recopilamos/i)).toBeInTheDocument();
    expect(screen.getByText(/Uso de la información/i)).toBeInTheDocument();
    expect(screen.getByText(/Almacenamiento y seguridad/i)).toBeInTheDocument();
  });
});

// ── InfoTooltip ───────────────────────────────────────────────────────────
describe("InfoTooltip", () => {
  it("renders the ? icon button", () => {
    // Validates: Requirements 10.6
    render(<InfoTooltip text="Este es un tooltip de prueba" />);

    const button = screen.getByRole("button", { name: /Más información/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("?");
  });

  it("renders the tooltip text in the DOM (hidden via CSS)", () => {
    render(<InfoTooltip text="Información importante sobre este campo" />);

    // The tooltip text is in the DOM but hidden via opacity-0 CSS
    expect(
      screen.getByText("Información importante sobre este campo")
    ).toBeInTheDocument();
  });

  it("tooltip has role=tooltip", () => {
    render(<InfoTooltip text="Tooltip accesible" />);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Tooltip accesible");
  });
});

// ── DataTransparencyCard ──────────────────────────────────────────────────
describe("DataTransparencyCard", () => {
  it("renders the collapsed header by default", () => {
    // Validates: Requirements 3.1, 10.4
    render(<DataTransparencyCard />);

    expect(screen.getByText(/¿Qué datos recopilamos\?/i)).toBeInTheDocument();
  });

  it("does not show data list when collapsed", () => {
    render(<DataTransparencyCard />);

    expect(screen.queryByText(/Correo electrónico/i)).not.toBeInTheDocument();
  });

  it("expands to show data types when clicked", () => {
    render(<DataTransparencyCard />);

    const button = screen.getByRole("button", { name: /¿Qué datos recopilamos\?/i });
    fireEvent.click(button);

    expect(screen.getByText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByText(/Nombre completo/i)).toBeInTheDocument();
    expect(screen.getByText(/Nombre de organización/i)).toBeInTheDocument();
  });

  it("collapses again when clicked a second time", () => {
    render(<DataTransparencyCard />);

    const button = screen.getByRole("button", { name: /¿Qué datos recopilamos\?/i });
    fireEvent.click(button); // expand
    fireEvent.click(button); // collapse

    expect(screen.queryByText(/Correo electrónico/i)).not.toBeInTheDocument();
  });

  it("has aria-expanded attribute that reflects state", () => {
    render(<DataTransparencyCard />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});

// ── PasswordStrengthIndicator ─────────────────────────────────────────────
describe("PasswordStrengthIndicator", () => {
  it("renders nothing for empty password", () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Débil" for passwords shorter than 6 characters', () => {
    // Validates: Requirements 10.6
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText(/Débil/i)).toBeInTheDocument();
  });

  it('shows "Débil" for a 5-character password', () => {
    render(<PasswordStrengthIndicator password="abcde" />);
    expect(screen.getByText(/Débil/i)).toBeInTheDocument();
  });

  it('shows "Media" for a 6-character password with a number', () => {
    render(<PasswordStrengthIndicator password="abc123" />);
    expect(screen.getByText(/Media/i)).toBeInTheDocument();
  });

  it('shows "Media" for a 7-character password without mixed chars', () => {
    render(<PasswordStrengthIndicator password="abcdefg" />);
    expect(screen.getByText(/Media/i)).toBeInTheDocument();
  });

  it('shows "Fuerte" for a 10+ character password with mixed characters', () => {
    render(<PasswordStrengthIndicator password="Abcdef123!" />);
    expect(screen.getByText(/Fuerte/i)).toBeInTheDocument();
  });

  it("renders 3 bar segments", () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test123" />
    );
    // Each segment has flex-1 and h-1 classes
    const segments = container.querySelectorAll(".h-1.flex-1");
    expect(segments.length).toBe(3);
  });

  it("fills 1 segment for weak password", () => {
    const { container } = render(
      <PasswordStrengthIndicator password="abc" />
    );
    const filledSegments = container.querySelectorAll(".bg-red-500");
    expect(filledSegments.length).toBe(1);
  });

  it("fills 2 segments for medium password", () => {
    const { container } = render(
      <PasswordStrengthIndicator password="abc123" />
    );
    const filledSegments = container.querySelectorAll(".bg-yellow-400");
    expect(filledSegments.length).toBe(2);
  });

  it("fills 3 segments for strong password", () => {
    const { container } = render(
      <PasswordStrengthIndicator password="Abcdef123!" />
    );
    const filledSegments = container.querySelectorAll(".bg-green-500");
    expect(filledSegments.length).toBe(3);
  });
});
