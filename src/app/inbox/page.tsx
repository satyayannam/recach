"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import {
  approveRecommendation,
  getPendingRecommendations,
  rejectRecommendation
} from "@/lib/api";
import type { PendingRecommendation } from "@/lib/types";


export const dynamic = "force-dynamic";

const INBOX_REFRESH_MS = 15000;

type NoteState = {
  title: string;
  body: string;
};

export default function InboxPage() {
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
      const data = await getPendingRecommendations();
      setRequests(data ?? []);
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
          {(requests ?? []).map((request) => (
            <div key={request.id} className="border-b border-white/10 pb-4">
              <div className="space-y-1">
                <p className="text-sm text-white/80">
                  {request.requester?.full_name ?? "Unknown"} (
                  {request.requester?.username ? `^${request.requester.username}` : "n/a"})
                </p>
                <p className="text-xs text-white/50">{request.rec_type}</p>
                <p className="text-xs text-white/50">{request.reason}</p>
                <p className="text-xs text-white/50">{request.created_at}</p>
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
