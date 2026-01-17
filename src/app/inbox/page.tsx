"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import {
  approveRecommendation,
  acceptContactRequest,
  getInboxItems,
  getContactForRequest,
  ignoreContactRequest,
  getCaretNotifications,
  getPendingRecommendations,
  rejectRecommendation
} from "@/lib/api";
import type { CaretNotification, InboxItem, PendingRecommendation } from "@/lib/types";


export const dynamic = "force-dynamic";

const INBOX_REFRESH_MS = 15000;

type NoteState = {
  title: string;
  body: string;
};

export default function InboxPage() {
  const [caretNotifications, setCaretNotifications] = useState<CaretNotification[]>([]);
  const [contactRequests, setContactRequests] = useState<InboxItem[]>([]);
  const [requests, setRequests] = useState<PendingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [notes, setNotes] = useState<Record<string | number, NoteState>>({});
  const [actionId, setActionId] = useState<string | number | null>(null);

  const loadInbox = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const [caretsData, recsData, inboxData] = await Promise.all([
        getCaretNotifications(50),
        getPendingRecommendations(),
        getInboxItems()
      ]);
      setCaretNotifications(caretsData ?? []);
      setRequests(recsData ?? []);
      setContactRequests(
        (inboxData ?? []).filter((item) => item.type === "CONTACT_REQUEST")
      );
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
