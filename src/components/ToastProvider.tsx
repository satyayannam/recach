"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  message: string;
  accentClass?: string;
};

type ToastContextValue = {
  addToast: (message: string, accentClass?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, accentClass?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, accentClass }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2500);
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-6 top-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="border border-white/10 bg-black px-4 py-2 text-sm shadow"
          >
            <span className={toast.accentClass ?? "text-white/80"}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
