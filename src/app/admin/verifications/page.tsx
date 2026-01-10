"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveAdminVerification,
  getAdminVerifications,
  rejectAdminVerification
} from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import type { AdminVerification } from "@/lib/types";

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [items, setItems] = useState<AdminVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminVerifications(statusFilter);
      setItems(data ?? []);
    } catch (err) {
      setError("Unable to load verifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    loadItems();
  }, [statusFilter, router]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    setError("");
    try {
      await approveAdminVerification(id, notes[id]);
      await loadItems();
    } catch (err) {
      setError("Unable to approve verification.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionId(id);
    setError("");
    try {
      await rejectAdminVerification(id, notes[id]);
      await loadItems();
    } catch (err) {
      setError("Unable to reject verification.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin Verifications</h1>
        <p className="text-white/60 text-sm">Approve or reject pending requests.</p>
      </header>

      <div className="flex items-center gap-3 text-sm">
        <label className="text-white/60">Status</label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="bg-black border border-white/20 px-2 py-1 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? <p className="text-sm text-white/60">Loading...</p> : null}
      {error ? <p className="text-sm text-white/60">{error}</p> : null}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border-b border-white/10 pb-4">
            <div className="space-y-1 text-sm">
              <p className="text-white/80">
                {item.subject_type} #{item.subject_id}
              </p>
              <p className="text-white/50">Contact: {item.contact_name}</p>
              <p className="text-white/50">{item.contact_email}</p>
              {item.contact_phone ? (
                <p className="text-white/50">{item.contact_phone}</p>
              ) : null}
              <p className="text-white/50">Status: {item.status}</p>
              {item.admin_notes ? (
                <p className="text-white/50">Notes: {item.admin_notes}</p>
              ) : null}
            </div>

            <div className="mt-3 space-y-2">
              <input
                value={notes[item.id] ?? ""}
                onChange={(event) =>
                  setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))
                }
                className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                placeholder="Admin notes (optional)"
              />
              {item.status === "PENDING" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
                    disabled={actionId === item.id}
                  >
                    {actionId === item.id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {!loading && items.length === 0 ? (
          <p className="text-sm text-white/60">No verification requests.</p>
        ) : null}
      </div>
    </section>
  );
}
