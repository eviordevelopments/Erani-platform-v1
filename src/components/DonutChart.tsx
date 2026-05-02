"use client";

import { motion } from "framer-motion";

interface DonutProps {
  percentage: number;
  label?: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export default function DonutChart({ percentage, label, color, size = 120, strokeWidth = 16 }: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-foreground/5"
        />
        {/* Progress track */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      {/* Label and Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}
