"use client";

import { Building2, Monitor, Users, User, CheckCircle2 } from "lucide-react";

interface OnboardingProgressBarProps {
  currentStep: number;
  completedSteps: number[];
}

const STEPS = [
  { label: "Organización", icon: Building2    },
  { label: "Entorno",      icon: Monitor      },
  { label: "Equipo",       icon: Users        },
  { label: "Cuenta",       icon: User         },
  { label: "Listo",        icon: CheckCircle2 },
];

export default function OnboardingProgressBar({
  currentStep,
  completedSteps,
}: OnboardingProgressBarProps) {
  return (
    /*
     * Floating centered pill — no background, animated border flow,
     * shadow glow, rounded-full. Sits fixed at top-center.
     */
    <div className="flex justify-center mt-8">
      <div className="relative flex items-center gap-2 rounded-full px-8 py-3 bg-foreground/5 backdrop-blur-2xl border border-glass-border shadow-2xl">
        {STEPS.map((step, index) => {
          const stepNumber  = index + 1;
          const isActive    = currentStep === stepNumber;
          const isCompleted = completedSteps.includes(stepNumber);
          const isLast      = index === STEPS.length - 1;
          const Icon        = step.icon;

          return (
            <div key={stepNumber} className="flex items-center">
              {/* Step pill */}
              <div
                title={`Nivel ${stepNumber}: ${step.label}`}
                className={[
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-erani-purple/15"
                    : isActive
                    ? "bg-erani-blue/15 shadow-[0_0_10px_rgba(0,85,160,0.35)]"
                    : "",
                ].join(" ")}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-erani-purple flex-shrink-0" />
                ) : (
                  <Icon
                    className={[
                      "w-3 h-3 flex-shrink-0",
                      isActive ? "text-erani-blue" : "text-foreground/25",
                    ].join(" ")}
                  />
                )}
                <span
                  className={[
                    "text-[8px] uppercase font-black tracking-widest whitespace-nowrap",
                    isCompleted
                      ? "text-erani-purple"
                      : isActive
                      ? "text-erani-blue"
                      : "text-foreground/30",
                  ].join(" ")}
                >
                  {stepNumber}. {step.label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="w-5 h-px mx-0.5 bg-foreground/10 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className={[
                      "h-full rounded-full transition-all duration-500",
                      isCompleted
                        ? "w-full bg-gradient-to-r from-erani-purple to-erani-blue"
                        : "w-0",
                    ].join(" ")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
