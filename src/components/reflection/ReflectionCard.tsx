"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { createPostReply } from "@/lib/posts";
import type { PostOut, PostReplyType } from "@/lib/types";

type ReflectionCardProps = {
  reflection: PostOut;
  label: string;
  onToggleCaret: (reflectionId: number) => void;
  caretActive: boolean;
  caretDisabled?: boolean;
  canDelete?: boolean;
  onDelete?: (postId: number) => void;
  canEdit?: boolean;
  onEdit?: (postId: number, content: string) => void;
  canReply?: boolean;
};

const normalizeTimestamp = (value: string) => {
  if (/z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  return `${value}Z`;
};

const formatDate = (value: string) => {
  const date = new Date(normalizeTimestamp(value));
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
  onDelete,
  canEdit,
  onEdit,
  canReply
}: ReflectionCardProps) {
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reflection.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyType, setReplyType] = useState<PostReplyType | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_URL ??
      process.env.NEXT_PUBLIC_API_BASE ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "",
    []
  );

  useEffect(() => {
    setDraft(reflection.content);
  }, [reflection.content]);

  useEffect(() => {
    if (!replyModalOpen) {
      setReplyMessage("");
      setReplyType(null);
    }
  }, [replyModalOpen]);

  const replyTypes: Array<{
    id: PostReplyType;
    label: string;
    hint?: string;
    buttonClass: string;
    badgeClass: string;
    placeholder: string;
  }> = [
    {
      id: "validate",
      label: "Validate",
      buttonClass: "border border-emerald-400/40 text-emerald-200 hover:border-emerald-300/70",
      badgeClass: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40",
      placeholder: "Confirm what resonates or is accurate."
    },
    {
      id: "context",
      label: "Add Context",
      buttonClass: "border border-sky-400/40 text-sky-200 hover:border-sky-300/70",
      badgeClass: "bg-sky-500/15 text-sky-200 border border-sky-400/40",
      placeholder: "Share context or nuance."
    },
    {
      id: "impact",
      label: "Highlight Impact",
      buttonClass: "border border-violet-400/40 text-violet-200 hover:border-violet-300/70",
      badgeClass: "bg-violet-500/15 text-violet-200 border border-violet-400/40",
      placeholder: "Call out what stood out and why."
    },
    {
      id: "clarify",
      label: "Clarify",
      buttonClass: "border border-amber-400/40 text-amber-200 hover:border-amber-300/70",
      badgeClass: "bg-amber-500/15 text-amber-200 border border-amber-400/40",
      placeholder: "Ask or confirm a specific detail."
    },
    {
      id: "challenge",
      label: "Challenge",
      hint: "rare",
      buttonClass: "border border-red-400/50 text-red-200 hover:border-red-300/80",
      badgeClass: "bg-red-500/15 text-red-200 border border-red-400/50",
      placeholder: "Push back thoughtfully and specifically."
    }
  ];

  const activeReplyType = replyTypes.find((item) => item.id === replyType);

  const profilePhoto = reflection.user.profile_photo_url
    ? reflection.user.profile_photo_url.startsWith("http")
      ? reflection.user.profile_photo_url
      : `${apiBase}${reflection.user.profile_photo_url}`
    : "";

  return (
    <article className="border border-white/20 rounded-3xl bg-black px-6 py-5 space-y-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40">
      <div className="text-xs text-white/60 flex flex-wrap items-center gap-2">
        <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-black">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={`${reflection.user.full_name} photo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-white/40">
              No photo
            </div>
          )}
        </div>
        <a
          href={`/u/${encodeURIComponent(reflection.user.username)}`}
          className="text-white/60 hover:text-white"
        >
          {reflection.user.full_name}
        </a>
        <a
          href={`/u/${encodeURIComponent(reflection.user.username)}`}
          className="text-white/30 hover:text-white/70"
        >
          @{reflection.user.username}
        </a>
        {reflection.user.university ? (
          <span className="text-white/30">{reflection.user.university}</span>
        ) : null}
      </div>
      <div className="text-[11px] text-purple-300">{label}</div>
      {editing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white"
          rows={4}
        />
      ) : (
        <p className="text-sm text-white/90 leading-relaxed">{reflection.content}</p>
      )}
      {canReply ? (
        <div className="flex flex-wrap gap-2">
          {replyTypes.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setReplyType(item.id);
                setReplyModalOpen(true);
              }}
              className={`px-3 py-1.5 text-xs rounded-full ${item.buttonClass}`}
            >
              {item.label}
              {item.hint ? <span className="ml-1 text-[10px] text-red-200/80">{item.hint}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between text-[11px] text-white/50">
        <span>{formatDate(reflection.created_at)}</span>
        <div className="flex items-center gap-2">
          {canEdit && onEdit ? (
            editing ? (
              confirmEdit ? (
                <>
                  <button
                    onClick={() => {
                      onEdit(reflection.id, draft);
                      setEditing(false);
                      setConfirmEdit(false);
                    }}
                    className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/80"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setConfirmEdit(false);
                      setEditing(false);
                      setDraft(reflection.content);
                    }}
                    className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/60"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmEdit(true)}
                  className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/70"
                >
                  Save
                </button>
              )
            ) : (
              <button
                onClick={() => {
                  setEditing(true);
                  setConfirmEdit(false);
                }}
                className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/70 hover:text-white"
              >
                Edit
              </button>
            )
          ) : null}
          {canDelete && onDelete ? (
            confirmDelete ? (
              <>
                <button
                  onClick={() => onDelete(reflection.id)}
                  className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/80"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/60"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="border border-white/20 px-3 py-2 rounded-full text-xs text-white/70 hover:text-white"
              >
                Delete
              </button>
            )
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
      {replyModalOpen && replyType ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-lg border border-white/10 bg-black p-5 space-y-4 rounded-t-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 text-xs rounded-full ${activeReplyType?.badgeClass ?? ""}`}>
                {activeReplyType?.label}
              </span>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>
            <textarea
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white"
              rows={4}
              placeholder={activeReplyType?.placeholder ?? "Write your reply..."}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setReplyModalOpen(false)}
                className="border border-white/20 px-3 py-2 text-xs text-white/60 hover:text-white/80"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!replyType) {
                    return;
                  }
                  const trimmed = replyMessage.trim();
                  if (!trimmed) {
                    addToast("Reply message is required.", "text-purple-300");
                    return;
                  }
                  setSendingReply(true);
                  try {
                    await createPostReply(reflection.id, {
                      type: replyType,
                      message: trimmed
                    });
                    addToast("Sent", "text-purple-300");
                    setReplyModalOpen(false);
                  } catch (err: any) {
                    const detail = err?.response?.data?.detail;
                    addToast(
                      typeof detail === "string" ? detail : "Unable to send reply.",
                      "text-purple-300"
                    );
                  } finally {
                    setSendingReply(false);
                  }
                }}
                className="border border-white/20 px-4 py-2 text-xs text-white/80 hover:text-white"
                disabled={sendingReply}
              >
                {sendingReply ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
