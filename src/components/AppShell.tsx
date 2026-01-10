"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ToastProvider from "@/components/ToastProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

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
