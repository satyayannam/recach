"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import {
  getMyAchievementScore,
  getMyProfile,
  getMyRecommendationScore,
  updateMyProfile
} from "@/lib/api";
import type { ScoreOut, UserProfile } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

type FormState = {
  headline: string;
  about: string;
  location: string;
  pronouns: string;
  website_url: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  twitter_url: string;
  visibility: "PUBLIC" | "ONLY_CONNECTIONS" | "PRIVATE";
  is_open_to_recommendations: boolean;
  is_hiring: boolean;
};

const emptyForm: FormState = {
  headline: "",
  about: "",
  location: "",
  pronouns: "",
  website_url: "",
  github_url: "",
  linkedin_url: "",
  portfolio_url: "",
  twitter_url: "",
  visibility: "PUBLIC",
  is_open_to_recommendations: false,
  is_hiring: false
};

export default function MePage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievement, setAchievement] = useState<ScoreOut | null>(null);
  const [recommendation, setRecommendation] = useState<ScoreOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const { addToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResult, achievementResult, recommendationResult] =
        await Promise.allSettled([
          getMyProfile(),
          getMyAchievementScore(),
          getMyRecommendationScore()
        ]);

      if (profileResult.status === "fulfilled") {
        const profileData = profileResult.value;
        setProfile(profileData);
        setForm({
          headline: profileData.headline ?? "",
          about: profileData.about ?? "",
          location: profileData.location ?? "",
          pronouns: profileData.pronouns ?? "",
          website_url: profileData.website_url ?? "",
          github_url: profileData.github_url ?? "",
          linkedin_url: profileData.linkedin_url ?? "",
          portfolio_url: profileData.portfolio_url ?? "",
          twitter_url: profileData.twitter_url ?? "",
          visibility: profileData.visibility ?? "PUBLIC",
          is_open_to_recommendations: Boolean(profileData.is_open_to_recommendations),
          is_hiring: Boolean(profileData.is_hiring)
        });
      } else if (profileResult.reason?.response?.status === 404) {
        setProfile(null);
        setForm(emptyForm);
      } else {
        setError("Unable to load profile.");
      }

      if (achievementResult.status === "fulfilled") {
        setAchievement(achievementResult.value);
        const prev = Number(localStorage.getItem("recach-achievement-score") ?? "0");
        const next = achievementResult.value.achievement_score ?? 0;
        if (next > prev) {
          addToast(`+${next - prev} Achievement points added`, "text-green-400");
        }
        localStorage.setItem("recach-achievement-score", String(next));
      }
      if (recommendationResult.status === "fulfilled") {
        setRecommendation(recommendationResult.value);
        const prev = Number(localStorage.getItem("recach-recommendation-score") ?? "0");
        const next = recommendationResult.value.recommendation_score ?? 0;
        if (next > prev) {
          addToast(`+${next - prev} Recommendation points added`, "text-purple-400");
        }
        localStorage.setItem("recach-recommendation-score", String(next));
      }
    } catch (err: any) {
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const normalizeValue = (value: string) => (value.trim() ? value.trim() : undefined);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: Partial<UserProfile> = {
        headline: normalizeValue(form.headline),
        about: normalizeValue(form.about),
        location: normalizeValue(form.location),
        pronouns: normalizeValue(form.pronouns),
        website_url: normalizeValue(form.website_url),
        github_url: normalizeValue(form.github_url),
        linkedin_url: normalizeValue(form.linkedin_url),
        portfolio_url: normalizeValue(form.portfolio_url),
        twitter_url: normalizeValue(form.twitter_url),
        visibility: form.visibility,
        is_open_to_recommendations: form.is_open_to_recommendations,
        is_hiring: form.is_hiring
      };

      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setSuccess("Profile updated.");
    } catch (err) {
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Protected>
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-white/60 text-sm">
            Manage your public profile and visibility.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-white/10 p-4">
            <p className="text-xs text-white/50">Achievement score</p>
            <p className="text-lg text-green-400">
              {achievement?.achievement_score ?? "-"}
            </p>
          </div>
          <div className="border border-white/10 p-4">
            <p className="text-xs text-white/50">Recommendation score</p>
            <p className="text-lg text-purple-400">
              {recommendation?.recommendation_score ?? "-"}
            </p>
          </div>
          <div className="border border-white/10 p-4">
            <p className="text-xs text-white/50">Profile status</p>
            <p className="text-lg">{profile ? "Active" : "Not created"}</p>
          </div>
        </div>

        {loading ? <p className="text-sm text-white/60">Loading...</p> : null}
        {error ? <p className="text-sm text-white/60">{error}</p> : null}
      {success ? <p className="text-sm text-white/60">{success}</p> : null}

        <div className="flex items-center justify-between max-w-2xl">
          <h2 className="text-lg font-semibold">Profile details</h2>
          <button
            onClick={() => setEditing((prev) => !prev)}
            className="border border-white/20 px-3 py-1 text-xs hover:text-white/80"
          >
            {editing ? "Close edit" : "Edit"}
          </button>
        </div>

        {!editing ? (
          <div className="space-y-4 max-w-2xl">
            <div>
              <p className="text-xs text-white/50">Headline</p>
              <p className="text-sm text-white/80">{profile?.headline ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">About</p>
              <p className="text-sm text-white/80">{profile?.about ?? "—"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-white/50">Location</p>
                <p className="text-sm text-white/80">{profile?.location ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Pronouns</p>
                <p className="text-sm text-white/80">{profile?.pronouns ?? "—"}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-white/50">Website</p>
                <p className="text-sm text-white/80">{profile?.website_url ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">GitHub</p>
                <p className="text-sm text-white/80">{profile?.github_url ?? "—"}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-white/50">LinkedIn</p>
                <p className="text-sm text-white/80">{profile?.linkedin_url ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Portfolio</p>
                <p className="text-sm text-white/80">{profile?.portfolio_url ?? "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/50">Twitter</p>
              <p className="text-sm text-white/80">{profile?.twitter_url ?? "—"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-white/50">Visibility</p>
                <p className="text-sm text-white/80">{profile?.visibility ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Open to recommendations</p>
                <p className="text-sm text-white/80">
                  {profile?.is_open_to_recommendations ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Hiring</p>
                <p className="text-sm text-white/80">{profile?.is_hiring ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Headline</label>
              <input
                value={form.headline}
                onChange={(event) => setForm({ ...form, headline: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70">About</label>
              <textarea
                value={form.about}
                onChange={(event) => setForm({ ...form, about: event.target.value })}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                rows={4}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Location</label>
                <input
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Pronouns</label>
                <input
                  value={form.pronouns}
                  onChange={(event) => setForm({ ...form, pronouns: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Website</label>
                <input
                  value={form.website_url}
                  onChange={(event) => setForm({ ...form, website_url: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">GitHub</label>
                <input
                  value={form.github_url}
                  onChange={(event) => setForm({ ...form, github_url: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/70">LinkedIn</label>
                <input
                  value={form.linkedin_url}
                  onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Portfolio</label>
                <input
                  value={form.portfolio_url}
                  onChange={(event) => setForm({ ...form, portfolio_url: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Twitter</label>
                <input
                  value={form.twitter_url}
                  onChange={(event) => setForm({ ...form, twitter_url: event.target.value })}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      visibility: event.target.value as FormState["visibility"]
                    })
                  }
                  className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="ONLY_CONNECTIONS">Only connections</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_open_to_recommendations}
                  onChange={(event) =>
                    setForm({ ...form, is_open_to_recommendations: event.target.checked })
                  }
                />
                Open to recommendations
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_hiring}
                  onChange={(event) => setForm({ ...form, is_hiring: event.target.checked })}
                />
                Hiring
              </label>
            </div>

            <button
              type="submit"
              className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        )}
      </section>
    </Protected>
  );
}
