"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ToastProvider from "@/components/ToastProvider";
import { clearToken, getToken } from "@/lib/auth";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAdmin) {
      return;
    }

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

    const clearTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };

    const handleTimeout = () => {
      if (!getToken()) {
        return;
      }
      clearToken();
      window.location.href = "/login";
    };

    const resetTimer = () => {
      if (!getToken()) {
        clearTimer();
        return;
      }
      clearTimer();
      timeoutRef.current = window.setTimeout(handleTimeout, INACTIVITY_LIMIT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart"
    ];

    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    window.addEventListener("recach-auth", resetTimer);
    resetTimer();

    return () => {
      clearTimer();
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      window.removeEventListener("recach-auth", resetTimer);
    };
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <ToastProvider>
        <main className="h-screen overflow-y-auto px-6 py-6 md:px-10">{children}</main>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Sidebar />
      <main className="h-screen overflow-y-auto px-6 py-6 md:px-10 ml-0 md:ml-64 pt-16 md:pt-6">
        {children}
      </main>
    </ToastProvider>
  );
}
