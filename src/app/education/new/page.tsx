"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import { addEducation, getEducationScore, getMyAchievementScore } from "@/lib/api";
import type { EducationOut, EducationScoreOut } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

const COOLDOWN_SECONDS = 20;

export default function AddEducationPage() {
  const [form, setForm] = useState({
    degree_type: "",
    college_id: "",
    gpa: "",
    start_date: "",
    end_date: "",
    is_completed: false,
    advisor_name: "",
    advisor_email: "",
    advisor_phone: ""
  });
  const [created, setCreated] = useState<EducationOut | null>(null);
  const [score, setScore] = useState<EducationScoreOut | null>(null);
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
        degree_type: form.degree_type,
        college_id: form.college_id,
        gpa: Number(form.gpa),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_completed: form.is_completed,
        advisor_name: form.advisor_name,
        advisor_email: form.advisor_email,
        advisor_phone: form.advisor_phone || null
      };
      const createdEducation = await addEducation(payload);
      setCreated(createdEducation);
      const scoreResult = await getEducationScore(createdEducation.id);
      setScore(scoreResult);
      const achievement = await getMyAchievementScore();
      const prev = Number(localStorage.getItem("recach-achievement-score") ?? "0");
      const next = achievement.achievement_score ?? 0;
      if (next > prev) {
        addToast(`+${next - prev} Achievement points added`, "text-green-400");
      }
      localStorage.setItem("recach-achievement-score", String(next));
      setStatus("Education entry submitted.");
      setShowConfirmation(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setStatus("Unable to add education entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Protected>
      <section className="space-y-6 max-w-2xl">
        <header>
          <h1 className="text-2xl font-semibold">Add Education</h1>
          <p className="text-white/60 text-sm">
            Submit education for verification.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Degree type</label>
              <input
                value={form.degree_type}
                onChange={(event) => setForm({ ...form, degree_type: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">College ID</label>
              <input
                value={form.college_id}
                onChange={(event) => setForm({ ...form, college_id: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/70">GPA</label>
              <input
                type="number"
                step="0.01"
                value={form.gpa}
                onChange={(event) => setForm({ ...form, gpa: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">Completed</label>
              <select
                value={form.is_completed ? "yes" : "no"}
                onChange={(event) => setForm({ ...form, is_completed: event.target.value === "yes" })}
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
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">End date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <h2 className="text-sm text-white/70">Advisor contact (required)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.advisor_name}
                onChange={(event) => setForm({ ...form, advisor_name: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                placeholder="Advisor name"
                required
              />
              <input
                type="email"
                value={form.advisor_email}
                onChange={(event) => setForm({ ...form, advisor_email: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                placeholder="Advisor email"
                required
              />
            </div>
            <input
              value={form.advisor_phone}
              onChange={(event) => setForm({ ...form, advisor_phone: event.target.value })}
              className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Advisor phone (optional)"
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
              : "Submit education"}
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
            <p className="text-sm text-white/70">Education entry #{created.id}</p>
            <p className="text-xs text-white/50">
              Verification status: {created.verification_status}
            </p>
          </div>
        ) : null}

        {score ? (
          <div className="border border-white/10 p-4 space-y-2">
            <p className="text-sm text-white/70">Education score</p>
            <p className="text-lg text-white/80">{score.total}</p>
            <p className="text-xs text-white/50">
              Base {score.breakdown.base} · Tier {score.breakdown.tier_bonus} · GPA{" "}
              {score.breakdown.gpa_bonus}
            </p>
          </div>
        ) : null}
      </section>
    </Protected>
  );
}
