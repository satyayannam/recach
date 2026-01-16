"use client";

import type { PostOut } from "@/lib/types";

type ReflectionCardProps = {
  reflection: PostOut;
  label: string;
  onToggleCaret: (reflectionId: number) => void;
  caretActive: boolean;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
};

export default function ReflectionCard({
  reflection,
  label,
  onToggleCaret,
  caretActive
}: ReflectionCardProps) {
  return (
    <article className="border border-white/20 rounded-3xl bg-black px-6 py-5 space-y-4">
      <div className="text-xs text-white/60 flex flex-wrap gap-2">
        <span>{reflection.user.full_name}</span>
        <span className="text-white/30">@{reflection.user.username}</span>
        {reflection.user.university ? (
          <span className="text-white/30">{reflection.user.university}</span>
        ) : null}
      </div>
      <div className="text-[11px] text-purple-300">{label}</div>
      <p className="text-sm text-white/90 leading-relaxed">{reflection.content}</p>
      <div className="flex items-center justify-between text-[11px] text-white/50">
        <span>{formatDate(reflection.created_at)}</span>
        <button
          onClick={() => onToggleCaret(reflection.id)}
          className={`border px-4 py-2 rounded-full text-base transition-transform duration-200 hover:scale-105 ${
            caretActive
              ? "border-green-400/70 text-green-300"
              : "border-white/30 text-white/70"
          }`}
        >
          ^{reflection.caret_count}
        </button>
      </div>
    </article>
  );
}
