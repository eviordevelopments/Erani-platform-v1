"use client";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type Strength = "débil" | "media" | "fuerte";

function getStrength(password: string): Strength {
  if (!password || password.length < 6) return "débil";

  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const mixedChars = (hasUppercase ? 1 : 0) + (hasLowercase ? 1 : 0) + (hasSpecial ? 1 : 0);

  if (password.length >= 10 && mixedChars >= 2) return "fuerte";
  if (password.length >= 6 && (hasNumber || mixedChars >= 1)) return "media";

  return "débil";
}

const STRENGTH_CONFIG: Record<
  Strength,
  { label: string; segments: number; color: string; textColor: string }
> = {
  débil: {
    label: "Débil",
    segments: 1,
    color: "bg-red-500",
    textColor: "text-red-500",
  },
  media: {
    label: "Media",
    segments: 2,
    color: "bg-yellow-400",
    textColor: "text-yellow-400",
  },
  fuerte: {
    label: "Fuerte",
    segments: 3,
    color: "bg-green-500",
    textColor: "text-green-500",
  },
};

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = getStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="flex flex-col gap-1.5 mt-1.5">
      {/* Segmented bar */}
      <div className="flex gap-1">
        {[1, 2, 3].map((segment) => (
          <div
            key={segment}
            className={[
              "h-1 flex-1 rounded-full transition-all duration-300",
              segment <= config.segments
                ? config.color
                : "bg-foreground/10",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Label */}
      <span
        className={[
          "text-[9px] uppercase tracking-widest font-black",
          config.textColor,
        ].join(" ")}
      >
        {config.label}
      </span>
    </div>
  );
}
