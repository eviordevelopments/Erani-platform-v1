"use client";

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <div className="relative group inline-flex items-center">
      {/* Trigger button */}
      <button
        type="button"
        aria-label="Más información"
        className="w-4 h-4 rounded-full border border-foreground/30 text-foreground/50 hover:border-erani-blue hover:text-erani-blue transition-colors flex items-center justify-center text-[9px] font-black leading-none"
      >
        ?
      </button>

      {/* Tooltip */}
      <div
        role="tooltip"
        className={[
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
          "w-max max-w-[220px] px-3 py-2",
          "glassmorphism text-[10px] text-foreground/80 leading-relaxed",
          "opacity-0 pointer-events-none",
          "group-hover:opacity-100 group-hover:pointer-events-auto",
          "transition-opacity duration-200",
        ].join(" ")}
      >
        {text}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-glass-border" />
      </div>
    </div>
  );
}
