"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// 10 minutes in milliseconds
const IDLE_TIMEOUT = 10 * 60 * 1000;

export default function IdleTimer() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (!user) return; // Don't start timer if not logged in

      timeoutRef.current = setTimeout(async () => {
        await signOut();
        router.push("/login");
      }, IDLE_TIMEOUT);
    };

    if (!user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // Set initial timer
    resetTimer();

    // Event listeners for user activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, signOut, router]);

  return null; // This component doesn't render anything
}
