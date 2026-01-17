"use client";

import { useEffect, useRef, useState } from "react";
import Protected from "@/components/Protected";
import {
  getMyAchievementScore,
  getMyProfile,
  getMyRecommendationScore,
  getMyReflectionCaretScore,
  updateMyProfile,
  uploadProfilePhoto
} from "@/lib/api";
import { listPosts } from "@/lib/posts";
import type { ScoreOut, UserProfile } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

export const dynamic = "force-dynamic";

const PROFILE_REFRESH_MS = 30000;

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
  const [caretScore, setCaretScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [posts, setPosts] = useState<string[]>([]);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const [profileResult, achievementResult, recommendationResult, postResult, caretResult] =
        await Promise.allSettled([
          getMyProfile(),
          getMyAchievementScore(),
          getMyRecommendationScore(),
          listPosts(200),
          getMyReflectionCaretScore()
        ]);

      if (profileResult.status === "fulfilled") {
        const profileData = profileResult.value;
        setProfile(profileData);
        if (!editing) {
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
        }
      } else if (profileResult.reason?.response?.status === 404) {
        setProfile(null);
        if (!editing) {
          setForm(emptyForm);
        }
      } else if (!silent) {
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
      if (caretResult.status === "fulfilled") {
        setCaretScore(caretResult.value.caret_score ?? 0);
      }
      if (postResult.status === "fulfilled") {
        const items = postResult.value;
        const myId = profileResult.status === "fulfilled" ? profileResult.value.user_id : null;
        const mine = myId
          ? items.filter((item) => item.user.id === myId).map((item) => item.content)
          : [];
        setPosts(mine);
      }
    } catch (err: any) {
      if (!silent) {
        setError("Unable to load profile.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, PROFILE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [editing]);

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
      setForm({
        headline: updated.headline ?? "",
        about: updated.about ?? "",
        location: updated.location ?? "",
        pronouns: updated.pronouns ?? "",
        website_url: updated.website_url ?? "",
        github_url: updated.github_url ?? "",
        linkedin_url: updated.linkedin_url ?? "",
        portfolio_url: updated.portfolio_url ?? "",
        twitter_url: updated.twitter_url ?? "",
        visibility: updated.visibility ?? "PUBLIC",
        is_open_to_recommendations: Boolean(updated.is_open_to_recommendations),
        is_hiring: Boolean(updated.is_hiring)
      });
      setSuccess("Profile updated.");
    } catch (err) {
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB.");
      return;
    }

    setPhotoUploading(true);
    setError("");
    try {
      const updated = await uploadProfilePhoto(file);
      setProfile((prev) => (prev ? { ...prev, profile_photo_url: updated.profile_photo_url } : updated));
      addToast("Profile photo updated.");
    } catch (err) {
      setError("Unable to update photo.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resolvePhotoUrl = (url?: string | null) => {
    if (!url) {
      return "";
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${apiBase}${url}`;
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

        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-black">
            {profile?.profile_photo_url ? (
              <img
                src={resolvePhotoUrl(profile.profile_photo_url)}
                alt="Profile photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
                No photo
              </div>
            )}
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-white/20 px-3 py-2 text-sm hover:text-white/80"
              disabled={photoUploading}
            >
              {photoUploading ? "Uploading..." : "Update Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div className="space-y-1 min-w-[220px]">
            <p className="text-sm text-white/80">{profile?.full_name ?? "Name unavailable"}</p>
            <p className="text-xs text-white/60">
              {profile?.username ? `^${profile.username}` : "Username unavailable"}
            </p>
            <p className="text-xs text-white/50">{profile?.email ?? "Email unavailable"}</p>
          </div>
        </div>

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
            <p className="text-xs text-white/50">Caret score</p>
            <p className="text-lg text-purple-300">^{caretScore ?? "-"}</p>
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
          <p className="text-sm text-white/60">
            Click Edit to view or update your profile details.
          </p>
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

        <div className="space-y-3 max-w-2xl">
          <h2 className="text-lg font-semibold">My posts</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-white/60">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((item, index) => (
                <div key={`${index}-${item.slice(0, 12)}`} className="border border-white/10 p-3">
                  <p className="text-sm text-white/80">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Protected>
  );
}

