"use client";

type ToastProps = {
  message: string;
  accentClass?: string;
};

export default function Toast({ message, accentClass }: ToastProps) {
  return (
    <div className="border border-white/10 bg-black px-4 py-2 text-sm shadow">
      <span className={accentClass ?? "text-white/80"}>{message}</span>
    </div>
  );
}
