"use client";

import type { PostOut } from "@/lib/types";

type ReflectionCardProps = {
  reflection: PostOut;
  label: string;
  onToggleCaret: (reflectionId: number) => void;
  caretActive: boolean;
  caretDisabled?: boolean;
  canDelete?: boolean;
  onDelete?: (postId: number) => void;
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
  caretActive,
  caretDisabled,
  canDelete,
  onDelete
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
        <div className="flex items-center gap-2">
          {canDelete && onDelete ? (
            <button
              onClick={() => onDelete(reflection.id)}
              className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/70 hover:text-white"
            >
              Delete
            </button>
          ) : null}
          <button
            onClick={() => onToggleCaret(reflection.id)}
            disabled={caretDisabled}
            className={`border px-4 py-2 rounded-full text-base transition-transform duration-200 ${
              caretActive
                ? "border-green-400/70 text-green-300"
                : "border-white/30 text-white/70"
            } ${caretDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
          >
            ^{reflection.caret_count}
          </button>
        </div>
      </div>
    </article>
  );
}
