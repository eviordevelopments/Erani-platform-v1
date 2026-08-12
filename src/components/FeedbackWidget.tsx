"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function FeedbackWidget() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // No mostrar el widget si ya estamos en la página de feedback o si no hay usuario logueado
  if (pathname === "/feedback" || loading || !user) return null;

  return (
    <Link id="tour-nav-feedback" href="/feedback" className="fixed bottom-6 right-24 z-[9998]">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-3.5 rounded-full shadow-2xl border transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(158,128,255,0.15) 0%, rgba(0,85,160,0.1) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "rgba(158, 128, 255, 0.4)",
          boxShadow: "0 0 15px rgba(158, 128, 255, 0.3), inset 0 0 10px rgba(158, 128, 255, 0.2)",
        }}
      >
        <MessageSquare className="w-5 h-5 text-erani-purple animate-pulse" />
        <span className="text-[11px] font-black uppercase tracking-widest text-white drop-shadow-md">
          Feedback
        </span>
      </motion.div>
    </Link>
  );
}
