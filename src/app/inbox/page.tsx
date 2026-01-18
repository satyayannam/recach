"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import {
  approveRecommendation,
  acceptContactRequest,
  getInboxItems,
  getInboxPosts,
  getContactForRequest,
  ignoreContactRequest,
  getCaretNotifications,
  getPendingRecommendations,
  rejectRecommendation
} from "@/lib/api";
import { setPostReplyOwnerReaction, togglePostReplyCaret } from "@/lib/posts";
import type {
  CaretNotification,
  InboxItem,
  InboxPostCard,
  InboxPostReplyOut,
  PendingRecommendation,
  PostReplyOwnerReaction
} from "@/lib/types";


export const dynamic = "force-dynamic";

const INBOX_REFRESH_MS = 15000;

type NoteState = {
  title: string;
  body: string;
};

export default function InboxPage() {
  const [caretNotifications, setCaretNotifications] = useState<CaretNotification[]>([]);
  const [contactRequests, setContactRequests] = useState<InboxItem[]>([]);
  const [generalNotifications, setGeneralNotifications] = useState<InboxItem[]>([]);
  const [postCards, setPostCards] = useState<InboxPostCard[]>([]);
  const [postNotifications, setPostNotifications] = useState<InboxItem[]>([]);
  const [requests, setRequests] = useState<PendingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [notes, setNotes] = useState<Record<string | number, NoteState>>({});
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [postActionId, setPostActionId] = useState<number | null>(null);

  const loadInbox = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const [caretsData, recsData, inboxData, inboxPosts] = await Promise.all([
        getCaretNotifications(50),
        getPendingRecommendations(),
        getInboxItems(),
        getInboxPosts()
      ]);
      setCaretNotifications(caretsData ?? []);
      setRequests(recsData ?? []);
      setContactRequests(
        (inboxData ?? []).filter((item) => item.type === "CONTACT_REQUEST")
      );
      setPostNotifications(
        (inboxData ?? []).filter(
          (item) => item.type === "POST_REPLY" || item.type === "POST_REPLY_REACTION"
        )
      );
      setGeneralNotifications(
        (inboxData ?? []).filter(
          (item) =>
            item.type !== "CONTACT_REQUEST" &&
            item.type !== "POST_REPLY" &&
            item.type !== "POST_REPLY_REACTION"
        )
      );
      setPostCards(inboxPosts ?? []);
    } catch (err) {
      setError("Unable to load inbox.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadInbox();
    const interval = setInterval(() => {
      loadInbox(true);
    }, INBOX_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (requestId: string | number) => {
    const note = notes[requestId] ?? { title: "", body: "" };
    setActionId(requestId);
    try {
      await approveRecommendation(Number(requestId), note.title, note.body);
      setExpandedId(null);
      await loadInbox();
    } catch (err) {
      setError("Unable to approve request.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (requestId: string | number) => {
    setActionId(requestId);
    try {
      await rejectRecommendation(Number(requestId));
      await loadInbox();
    } catch (err) {
      setError("Unable to reject request.");
    } finally {
      setActionId(null);
    }
  };

  const updateNote = (
    requestId: string | number,
    field: "title" | "body",
    value: string
  ) => {
    setNotes((prev) => ({
      ...prev,
      [requestId]: { ...prev[requestId], [field]: value }
    }));
  };

  useEffect(() => {
    if (!caretNotifications.length || typeof window === "undefined") {
      return;
    }
    const maxId = Math.max(...caretNotifications.map((note) => note.id));
    localStorage.setItem("recach_caret_seen_id", String(maxId));
    window.dispatchEvent(new Event("recach-caret"));
  }, [caretNotifications]);

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  const replyStyles: Record<
    InboxPostReplyOut["reply_type"],
    { badge: string; border: string }
  > = {
    validate: {
      badge: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40",
      border: "border-emerald-400/40"
    },
    context: {
      badge: "bg-sky-500/15 text-sky-200 border border-sky-400/40",
      border: "border-sky-400/40"
    },
    impact: {
      badge: "bg-violet-500/15 text-violet-200 border border-violet-400/40",
      border: "border-violet-400/40"
    },
    clarify: {
      badge: "bg-amber-500/15 text-amber-200 border border-amber-400/40",
      border: "border-amber-400/40"
    },
    challenge: {
      badge: "bg-red-500/15 text-red-200 border border-red-400/50",
      border: "border-red-400/50"
    }
  };

  const handleToggleReplyCaret = async (replyId: number) => {
    setPostActionId(replyId);
    try {
      const result = await togglePostReplyCaret(replyId);
      setPostCards((prev) =>
        prev.map((card) => ({
          ...card,
          replies: card.replies.map((reply) =>
            reply.id === replyId ? { ...reply, caret_given: result.is_given } : reply
          )
        }))
      );
    } catch (err) {
      setError("Unable to update caret.");
    } finally {
      setPostActionId(null);
    }
  };

  const handleSendReaction = async (
    replyId: number,
    reaction: PostReplyOwnerReaction
  ) => {
    setPostActionId(replyId);
    try {
      await setPostReplyOwnerReaction(replyId, reaction);
      setPostCards((prev) =>
        prev.map((card) => ({
          ...card,
          replies: card.replies.map((reply) =>
            reply.id === replyId ? { ...reply, owner_reaction: reaction } : reply
          )
        }))
      );
    } catch (err) {
      setError("Unable to send reaction.");
    } finally {
      setPostActionId(null);
    }
  };

  return (
    <Protected>
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-white/60 text-sm">
            Pending recommendation requests.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-white/60">Loading...</p>
        ) : null}
        {error ? <p className="text-sm text-white/60">{error}</p> : null}

        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-sm text-white/70">Posts</h2>
            {postCards.length === 0 ? (
              <p className="text-sm text-white/60">No post replies yet.</p>
            ) : (
              <div className="space-y-4">
                {postCards.map((card) => (
                  <div
                    key={card.post_id}
                    className="border border-white/10 rounded-2xl p-4 space-y-3"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-white/50">
                        {card.post_type} · {formatDate(card.post_created_at)}
                      </p>
                      <p className="text-sm text-white/80">{card.post_content}</p>
                    </div>
                    {card.replies.length === 0 ? (
                      <p className="text-xs text-white/50">No replies yet.</p>
                    ) : (
                      <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1">
                        {card.replies.map((reply) => {
                          const styles = replyStyles[reply.reply_type];
                          const replyLabel = {
                            validate: "Validate",
                            context: "Add Context",
                            impact: "Highlight Impact",
                            clarify: "Clarify",
                            challenge: "Challenge"
                          }[reply.reply_type];
                          const reactionLabel = {
                            thanks: "Thanks",
                            helpful: "Helpful",
                            noted: "Noted",
                            appreciate: "Appreciate it"
                          };
                          return (
                            <div
                              key={reply.id}
                              className={`border ${styles.border} border-l-4 rounded-xl p-3 space-y-2`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={`px-2 py-0.5 text-[10px] rounded-full ${styles.badge}`}>
                                  {replyLabel}
                                </span>
                                <span className="text-[10px] text-white/50">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <div className="text-xs text-white/70">
                                {reply.sender.full_name} @{reply.sender.username}
                              </div>
                              <p className="text-sm text-white/80">{reply.message}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  className={`border px-3 py-1 text-xs rounded-full ${
                                    reply.caret_given
                                      ? "border-emerald-400/50 text-emerald-200"
                                      : "border-white/30 text-white/70"
                                  }`}
                                  onClick={() => handleToggleReplyCaret(reply.id)}
                                  disabled={postActionId === reply.id}
                                >
                                  ^ {reply.caret_given ? "Caret" : "Give caret"}
                                </button>
                                <select
                                  className="bg-black border border-white/20 px-2 py-1 text-xs text-white/70"
                                  value={reply.owner_reaction ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value as PostReplyOwnerReaction;
                                    if (!value) {
                                      return;
                                    }
                                    handleSendReaction(reply.id, value);
                                  }}
                                  disabled={postActionId === reply.id}
                                >
                                  <option value="">React</option>
                                  <option value="thanks">Thanks</option>
                                  <option value="helpful">Helpful</option>
                                  <option value="noted">Noted</option>
                                  <option value="appreciate">Appreciate it</option>
                                </select>
                                {reply.owner_reaction ? (
                                  <span className="text-[10px] text-white/50">
                                    Sent: {reactionLabel[reply.owner_reaction]}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {postNotifications.length === 0 ? null : (
              <div className="space-y-3">
                <h3 className="text-xs text-white/60">Updates for you</h3>
                {postNotifications.map((item) => {
                  const payload = item.payload_json as Record<string, any>;
                  if (item.type === "POST_REPLY") {
                    return (
                      <div key={item.id} className="border-b border-white/10 pb-3">
                        <p className="text-sm text-white/80">
                          {payload.sender?.full_name ?? "Someone"} sent a{" "}
                          {payload.reply_type} reply.
                        </p>
                        <p className="text-xs text-white/60">{payload.reply_message}</p>
                        <p className="text-xs text-white/40">{formatDate(payload.created_at)}</p>
                      </div>
                    );
                  }
                  if (item.type === "POST_REPLY_REACTION") {
                    return (
                      <div key={item.id} className="border-b border-white/10 pb-3">
                        <p className="text-sm text-white/80">
                          {payload.sender?.full_name ?? "Someone"} reacted:{" "}
                          {payload.reaction}
                        </p>
                        <p className="text-xs text-white/40">{formatDate(payload.created_at)}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h2 className="text-sm text-white/70">Caret notifications</h2>
            {caretNotifications.length === 0 ? (
              <p className="text-sm text-white/60">No caret activity yet.</p>
            ) : (
              caretNotifications.map((note) => (
                <div key={note.id} className="border-b border-white/10 pb-3">
                  <p className="text-sm text-green-400">
                    <a
                      href={`/u/${encodeURIComponent(note.giver.username)}`}
                      className="hover:text-green-200"
                    >
                      {note.giver.full_name}
                    </a>{" "}
                    gave your post a caret.
                  </p>
                  <p className="text-xs text-green-300/80">
                    {note.post_type} · ^{note.caret_count}
                  </p>
                  <p className="text-xs text-white/60 line-clamp-2">
                    {note.post_content}
                  </p>
                  <p className="text-xs text-white/40">{formatDate(note.created_at)}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm text-white/70">Contact requests</h2>
            {contactRequests.length === 0 ? (
              <p className="text-sm text-white/60">No contact requests.</p>
            ) : (
              contactRequests.map((item) => {
                const payload = item.payload_json as Record<string, any>;
                const requestId = String(payload.request_id ?? "");
                const contactKey = `contact-${requestId}`;
                return (
                  <div key={item.id} className="border-b border-white/10 pb-3">
                    <p className="text-sm text-white/80">
                      {payload.requester_name} requested your contact for{" "}
                      {payload.course_number} ({payload.course_name})
                      {payload.university ? ` · ${payload.university}` : ""}
                    </p>
                    <p className="text-xs text-white/50">
                      Status: {item.status}
                    </p>
                    {item.status === "PENDING" ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                          onClick={async () => {
                            try {
                              await acceptContactRequest(requestId);
                              await loadInbox(true);
                            } catch (err) {
                              setError("Unable to accept request.");
                            }
                          }}
                        >
                          Accept
                        </button>
                        <button
                          className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                          onClick={async () => {
                            try {
                              await ignoreContactRequest(requestId);
                              await loadInbox(true);
                            } catch (err) {
                              setError("Unable to ignore request.");
                            }
                          }}
                        >
                          Ignore
                        </button>
                      </div>
                    ) : null}
                    {item.status === "ACCEPTED" ? (
                      <p className="text-xs text-white/50 mt-2">
                        Accepted. The requester can now view your contact.
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm text-white/70">Notifications</h2>
            {generalNotifications.length === 0 ? (
              <p className="text-sm text-white/60">No notifications yet.</p>
            ) : (
              generalNotifications.map((item) => {
                const payload = item.payload_json as Record<string, any>;
                if (item.type === "CONTACT_ACCEPTED") {
                  return (
                    <div key={item.id} className="border-b border-white/10 pb-3">
                      <p className="text-sm text-white/80">
                        {payload.target_name} approved your contact request.
                      </p>
                      <p className="text-xs text-white/50">
                        Method: {payload.contact_method ?? "Not set"}
                      </p>
                      {payload.request_id ? (
                        <button
                          className="mt-2 border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                          onClick={async () => {
                            try {
                              const contact = await getContactForRequest(
                                String(payload.request_id)
                              );
                              setGeneralNotifications((prev) =>
                                prev.map((note) =>
                                  note.id === item.id
                                    ? {
                                        ...note,
                                        payload_json: {
                                          ...note.payload_json,
                                          contact_value: `${contact.method}: ${contact.value}`
                                        }
                                      }
                                    : note
                                )
                              );
                            } catch (err) {
                              setError("Unable to load contact.");
                            }
                          }}
                        >
                          View contact
                        </button>
                      ) : null}
                      {payload.contact_value ? (
                        <p className="text-xs text-white/70 mt-2">
                          {payload.contact_value}
                        </p>
                      ) : null}
                    </div>
                  );
                }
                if (item.type === "RECOMMENDATION_APPROVED") {
                  return (
                    <div key={item.id} className="border-b border-white/10 pb-3">
                      <p className="text-sm text-white/80">
                        {payload.recommender_name} approved your recommendation.
                      </p>
                      {payload.note_title ? (
                        <p className="text-xs text-white/60 mt-1">
                          {payload.note_title}
                        </p>
                      ) : null}
                      {payload.note_body ? (
                        <p className="text-xs text-white/50 mt-1">
                          {payload.note_body}
                        </p>
                      ) : null}
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>

          {(requests ?? []).map((request) => (
            <div key={request.id} className="border-b border-white/10 pb-4">
              <div className="space-y-1">
                <p className="text-sm text-white/80">
                  {request.requester?.full_name ?? "Unknown"} (
                  {request.requester?.username ? `^${request.requester.username}` : "n/a"})
                </p>
                <p className="text-xs text-white/50">{request.rec_type}</p>
                <p className="text-xs text-white/50">{request.reason}</p>
                <p className="text-xs text-white/50">{formatDate(request.created_at)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === request.id ? null : request.id)
                  }
                  className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                  disabled={actionId === request.id}
                >
                  {actionId === request.id ? "Rejecting..." : "Reject"}
                </button>
              </div>

              {expandedId === request.id ? (
                <div className="mt-4 space-y-3">
                  <input
                    value={notes[request.id]?.title ?? ""}
                    onChange={(event) =>
                      updateNote(request.id, "title", event.target.value)
                    }
                    className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    placeholder="Note title"
                  />
                  <textarea
                    value={notes[request.id]?.body ?? ""}
                    onChange={(event) =>
                      updateNote(request.id, "body", event.target.value)
                    }
                    className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    rows={3}
                    placeholder="Note body"
                  />
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                    disabled={actionId === request.id}
                  >
                    {actionId === request.id ? "Submitting..." : "Submit approval"}
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          {!loading && requests.length === 0 ? (
            <p className="text-sm text-white/60">No pending requests.</p>
          ) : null}
        </div>
      </section>
    </Protected>
  );
}
