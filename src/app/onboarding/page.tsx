"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addEducation, addWork, getMyProfile, updateMyProfile } from "@/lib/api";
import { getToken } from "@/lib/auth";

type OnboardingPath = "education" | "work" | "freelance";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"username" | "path" | "form" | "done">("username");
  const [username, setUsername] = useState("");
  const [path, setPath] = useState<OnboardingPath | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [degreeType, setDegreeType] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [gpa, setGpa] = useState("");
  const [eduStartDate, setEduStartDate] = useState("");
  const [eduEndDate, setEduEndDate] = useState("");
  const [eduCompleted, setEduCompleted] = useState(false);
  const [advisorName, setAdvisorName] = useState("");
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [advisorPhone, setAdvisorPhone] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [workCurrent, setWorkCurrent] = useState(false);
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();
        if (profile?.username) {
          setUsername(profile.username);
          setStep("path");
        } else {
          setStep("username");
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setStep("username");
        } else {
          setError("Unable to load your profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const submitUsername = async () => {
    setError("");
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!username.startsWith("^")) {
      setError("Username must start with ^.");
      return;
    }
    setSubmitting(true);
    try {
      await updateMyProfile({ username });
      setStep("path");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Unable to set username.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEducation = async () => {
    setError("");
    setSubmitting(true);
    try {
      await addEducation({
        degree_type: degreeType,
        college_id: collegeId,
        gpa: Number(gpa || 0),
        start_date: eduStartDate || null,
        end_date: eduEndDate || null,
        is_completed: eduCompleted,
        advisor_name: advisorName,
        advisor_email: advisorEmail,
        advisor_phone: advisorPhone || null
      });
      setStatus("Sent for verification");
      setStep("done");
      setTimeout(() => router.replace("/"), 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Unable to submit education.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitWork = async () => {
    setError("");
    setSubmitting(true);
    try {
      await addWork({
        company_name: path === "freelance" ? "Freelance" : companyName,
        title: jobTitle,
        employment_type: path === "freelance" ? "contract" : employmentType,
        is_current: workCurrent,
        start_date: workStartDate,
        end_date: workEndDate || null,
        supervisor_name: supervisorName,
        supervisor_email: supervisorEmail,
        supervisor_phone: supervisorPhone || null,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null
      });
      setStatus("Sent for verification");
      setStep("done");
      setTimeout(() => router.replace("/"), 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Unable to submit work.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-white/60">Loading...</p>;
  }

  return (
    <section className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finish setup</h1>
        <p className="text-white/60 text-sm">
          Create your username and submit one verification path.
        </p>
      </div>

      {step === "username" ? (
        <div className="space-y-4">
          <label className="text-sm text-white/70">Choose a username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
            placeholder="^username"
          />
          {error ? <p className="text-sm text-white/60">{error}</p> : null}
          <button
            type="button"
            className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
            onClick={submitUsername}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save username"}
          </button>
        </div>
      ) : null}

      {step === "path" ? (
        <div className="space-y-4">
          <p className="text-sm text-white/60">Pick one verification path.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <button
              type="button"
              className="border border-white/20 px-4 py-3 text-sm hover:text-white/80"
              onClick={() => {
                setPath("education");
                setStep("form");
              }}
            >
              School / University
            </button>
            <button
              type="button"
              className="border border-white/20 px-4 py-3 text-sm hover:text-white/80"
              onClick={() => {
                setPath("work");
                setStep("form");
              }}
            >
              Work
            </button>
            <button
              type="button"
              className="border border-white/20 px-4 py-3 text-sm hover:text-white/80"
              onClick={() => {
                setPath("freelance");
                setStep("form");
              }}
            >
              Freelance
            </button>
          </div>
        </div>
      ) : null}

      {step === "form" && path === "education" ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitEducation();
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={degreeType}
              onChange={(event) => setDegreeType(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Degree type (bachelor)"
              required
            />
            <input
              value={collegeId}
              onChange={(event) => setCollegeId(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="College ID"
              required
            />
            <input
              value={gpa}
              onChange={(event) => setGpa(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="GPA"
              type="number"
              step="0.01"
              required
            />
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={eduCompleted}
                onChange={(event) => setEduCompleted(event.target.checked)}
              />
              Completed
            </label>
            <input
              value={eduStartDate}
              onChange={(event) => setEduStartDate(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              type="date"
              placeholder="Start date"
            />
            <input
              value={eduEndDate}
              onChange={(event) => setEduEndDate(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              type="date"
              placeholder="End date"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={advisorName}
              onChange={(event) => setAdvisorName(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Advisor name"
              required
            />
            <input
              value={advisorEmail}
              onChange={(event) => setAdvisorEmail(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Advisor email"
              type="email"
              required
            />
            <input
              value={advisorPhone}
              onChange={(event) => setAdvisorPhone(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Advisor phone"
            />
          </div>
          {error ? <p className="text-sm text-white/60">{error}</p> : null}
          <button
            type="submit"
            className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      ) : null}

      {step === "form" && (path === "work" || path === "freelance") ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitWork();
          }}
        >
          {path === "work" ? (
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Company name"
              required
            />
          ) : (
            <div className="text-xs text-white/50">Company: Freelance</div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Title"
              required
            />
            {path === "work" ? (
              <input
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value)}
                className="bg-black border border-white/20 px-3 py-2 text-sm"
                placeholder="Employment type (full_time)"
                required
              />
            ) : null}
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={workCurrent}
                onChange={(event) => setWorkCurrent(event.target.checked)}
              />
              Currently here
            </label>
            <input
              value={workStartDate}
              onChange={(event) => setWorkStartDate(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              type="date"
              placeholder="Start date"
              required
            />
            <input
              value={workEndDate}
              onChange={(event) => setWorkEndDate(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              type="date"
              placeholder="End date"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={supervisorName}
              onChange={(event) => setSupervisorName(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Supervisor name"
              required
            />
            <input
              value={supervisorEmail}
              onChange={(event) => setSupervisorEmail(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Supervisor email"
              type="email"
              required
            />
            <input
              value={supervisorPhone}
              onChange={(event) => setSupervisorPhone(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Supervisor phone"
            />
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Extra contact name (optional)"
            />
            <input
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Extra contact email"
              type="email"
            />
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              className="bg-black border border-white/20 px-3 py-2 text-sm"
              placeholder="Extra contact phone"
            />
          </div>
          {error ? <p className="text-sm text-white/60">{error}</p> : null}
          <button
            type="submit"
            className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <p className="text-sm text-white/60">{status || "Sent for verification"}</p>
      ) : null}
    </section>
  );
}
