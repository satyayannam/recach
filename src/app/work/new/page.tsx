"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import { addWork, getMyAchievementScore, getWorkScore } from "@/lib/api";
import type { WorkOut, WorkScoreOut } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

const COOLDOWN_SECONDS = 20;

export default function AddWorkPage() {
  const [form, setForm] = useState({
    company_name: "",
    title: "",
    employment_type: "full_time",
    is_current: false,
    start_date: "",
    end_date: "",
    supervisor_name: "",
    supervisor_email: "",
    supervisor_phone: "",
    contact_name: "",
    contact_email: "",
    contact_phone: ""
  });
  const [created, setCreated] = useState<WorkOut | null>(null);
  const [score, setScore] = useState<WorkScoreOut | null>(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || cooldown > 0) {
      return;
    }
    setStatus("");
    setScore(null);
    setSubmitting(true);
    try {
      const payload = {
        company_name: form.company_name,
        title: form.title,
        employment_type: form.employment_type,
        is_current: form.is_current,
        start_date: form.start_date,
        end_date: form.is_current ? null : form.end_date || null,
        supervisor_name: form.supervisor_name,
        supervisor_email: form.supervisor_email,
        supervisor_phone: form.supervisor_phone || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null
      };
      const createdWork = await addWork(payload);
      setCreated(createdWork);
      const scoreResult = await getWorkScore(createdWork.id);
      setScore(scoreResult);
      const achievement = await getMyAchievementScore();
      const prev = Number(localStorage.getItem("recach-achievement-score") ?? "0");
      const next = achievement.achievement_score ?? 0;
      if (next > prev) {
        addToast(`+${next - prev} Achievement points added`, "text-green-400");
      }
      localStorage.setItem("recach-achievement-score", String(next));
      setStatus("Work entry submitted.");
      setShowConfirmation(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setStatus("Unable to add work entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Protected>
      <section className="space-y-6 max-w-2xl">
        <header>
          <h1 className="text-2xl font-semibold">Add Work</h1>
          <p className="text-white/60 text-sm">
            Submit work experience for verification.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Company name</label>
              <input
                value={form.company_name}
                onChange={(event) => setForm({ ...form, company_name: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Employment type</label>
              <select
                value={form.employment_type}
                onChange={(event) => setForm({ ...form, employment_type: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Current role</label>
              <select
                value={form.is_current ? "yes" : "no"}
                onChange={(event) => setForm({ ...form, is_current: event.target.value === "yes" })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Start date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                required
              />
            </div>
            {!form.is_current ? (
              <div className="space-y-2">
                <label className="text-sm text-white/70">End date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                  required={!form.is_current}
                />
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <h2 className="text-sm text-white/70">Supervisor (required)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.supervisor_name}
                onChange={(event) => setForm({ ...form, supervisor_name: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                placeholder="Supervisor name"
                required
              />
              <input
                type="email"
                value={form.supervisor_email}
                onChange={(event) => setForm({ ...form, supervisor_email: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                placeholder="Supervisor email"
                required
              />
            </div>
            <input
              value={form.supervisor_phone}
              onChange={(event) => setForm({ ...form, supervisor_phone: event.target.value })}
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Supervisor phone (optional)"
            />
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <h2 className="text-sm text-white/70">Additional contact (optional)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.contact_name}
                onChange={(event) => setForm({ ...form, contact_name: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                placeholder="Contact name"
              />
              <input
                type="email"
                value={form.contact_email}
                onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                placeholder="Contact email"
              />
            </div>
            <input
              value={form.contact_phone}
              onChange={(event) => setForm({ ...form, contact_phone: event.target.value })}
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Contact phone"
            />
          </div>

          <button
            type="submit"
            className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
            disabled={submitting || cooldown > 0}
          >
            {submitting
              ? "Submitting..."
              : cooldown > 0
              ? `Please wait ${cooldown}s`
              : "Submit work"}
          </button>
        </form>

        {showConfirmation ? (
          <div className="border border-white/10 bg-black/40 p-4 text-sm text-white/80">
            <p className="text-base text-white">We received your request. It has been sent.</p>
            <p className="text-white/60 mt-1">
              Do not send multiple educations/work items. We already received your request.
            </p>
          </div>
        ) : null}

        {status ? <p className="text-sm text-white/60">{status}</p> : null}

        {created ? (
          <div className="border-t border-white/10 pt-4 space-y-2">
            <p className="text-sm text-white/70">Work entry #{created.id}</p>
            <p className="text-xs text-white/50">
              Verification status: {created.verification_status}
            </p>
          </div>
        ) : null}

        {score ? (
          <div className="border border-white/10 p-4 space-y-2">
            <p className="text-sm text-white/70">Work score</p>
            <p className="text-lg text-white/80">{score.total}</p>
            <p className="text-xs text-white/50">
              Base {score.breakdown.base} · Months {score.breakdown.months} · Bonus{" "}
              {score.breakdown.duration_bonus}
            </p>
          </div>
        ) : null}
      </section>
    </Protected>
  );
}
