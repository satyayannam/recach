"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMyAchievementScore, getPublicProfile, requestRecommendation } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PublicUserOut } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { listPostsByUser, togglePostCaret } from "@/lib/posts";

export const dynamic = "force-dynamic";

const PROFILE_REFRESH_MS = 30000;
const USER_REFRESH_MS = 30000;

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicUserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllRecommenders, setShowAllRecommenders] = useState(false);
  const [recType, setRecType] = useState("academic");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Array<{ id: number; content: string; created_at: string; type: string; caret_count?: number }>>([]);
  const { addToast } = useToast();

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  const decoded = decodeURIComponent(params?.username ?? "");
  const hasToken = Boolean(getToken());

  useEffect(() => {
    let canceled = false;

    const loadProfile = async (silent = false) => {
      if (!decoded) {
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      setError("");
      try {
        const data = await getPublicProfile(decoded);
        if (!canceled) {
          setProfile(data);
          if (data?.id) {
            const postsData = await listPostsByUser(data.id, 50);
            setPosts(postsData);
          }
        }
      } catch (err) {
        if (!canceled) {
          setError("Unable to load profile.");
        }
      } finally {
        if (!silent && !canceled) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    const interval = setInterval(() => {
      loadProfile(true);
    }, PROFILE_REFRESH_MS);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [decoded]);

  useEffect(() => {
    let canceled = false;

    const loadCurrentUser = async (silent = false) => {
      if (!hasToken) {
        setCurrentUserId(null);
        return;
      }
      try {
        const data = await getMyAchievementScore();
        if (!canceled) {
          setCurrentUserId(data.user_id ?? null);
        }
      } catch (err) {
        if (!canceled) {
          setCurrentUserId(null);
        }
      }
    };

    loadCurrentUser();
    const interval = setInterval(() => {
      loadCurrentUser(true);
    }, USER_REFRESH_MS);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [hasToken]);

  if (loading) {
    return <p className="text-sm text-white/60">Loading profile...</p>;
  }

  if (error || !profile) {
    return <p className="text-sm text-white/60">{error || "Profile not found."}</p>;
  }

  const profilePhotoUrl =
    profile.profile_photo_url && !profile.profile_photo_url.startsWith("http")
      ? `${apiBase}${profile.profile_photo_url}`
      : profile.profile_photo_url ?? "";
  const verifiedEducation = profile.verified_education ?? [];
  const verifiedWork = profile.verified_work ?? [];
  const hasVerifiedDetails = verifiedEducation.length > 0 || verifiedWork.length > 0;

  return (
    <section className="space-y-6">
      <header>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-black">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={`${profile.full_name} photo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
                No photo
              </div>
            )}
          </div>
          <div>
            <a
              href={`/u/${encodeURIComponent(profile.username)}`}
              className="text-2xl font-semibold hover:text-white/80"
            >
              {profile.full_name}
            </a>
            <a
              href={`/u/${encodeURIComponent(profile.username)}`}
              className="text-white/60 text-sm hover:text-white/80 block"
            >
              ^{profile.username}
            </a>
          </div>
        </div>
        <div className="mt-3 text-sm text-white/60 space-y-1">
          {hasVerifiedDetails ? (
            <>
              {verifiedEducation.map((edu) => (
                <p key={`${edu.university_name}-${edu.degree_type}`}>
                  {edu.university_name} ({edu.degree_type})
                </p>
              ))}
              {verifiedWork.map((work) => (
                <p key={`${work.company_name}-${work.title}`}>
                  {work.company_name} - {work.title}
                </p>
              ))}
            </>
          ) : (
            <p className="text-white/40">Pending verification</p>
          )}
        </div>
      </header>

      {hasToken ? (
        <div className="border-t border-white/10 pt-4 space-y-3">
          <h2 className="text-sm text-white/70">Recommendation Request</h2>
          <button
            className={`border border-white/20 px-4 py-2 text-sm ${
              currentUserId === profile.id ? "text-white/40 cursor-not-allowed" : "hover:text-white/80"
            }`}
            onClick={() => {
              if (currentUserId === profile.id) {
                setStatus("You cannot request a recommendation from yourself.");
                return;
              }
              setRecType("academic");
              setReason("");
              setStatus("");
              setModalOpen(true);
            }}
          >
            Request Recommendation
          </button>
          {status ? <p className="text-sm text-white/60">{status}</p> : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm text-white/50">Recommenders</p>
        {profile.recommended_by?.length ? (
          <div className="text-white/80 text-sm">
            <span>
              Recommended by:{" "}
              {(showAllRecommenders
                ? profile.recommended_by
                : profile.recommended_by.slice(0, 4)
              )
                .map((rec, idx) =>
                  rec.username ? (
                    <a
                      key={`${rec.username}-${idx}`}
                      href={`/u/${encodeURIComponent(rec.username)}`}
                      className="text-white/80 hover:text-white"
                    >
                      ^{rec.username}
                    </a>
                  ) : (
                    <span key={`${rec.full_name}-${idx}`}>{rec.full_name}</span>
                  )
                )
                .reduce<React.ReactNode[]>((acc, item, idx) => {
                  if (idx > 0) {
                    acc.push(", ");
                  }
                  acc.push(item);
                  return acc;
                }, [])}
            </span>
            {profile.recommender_count > 4 ? (
              <button
                type="button"
                className="ml-2 text-xs text-white/60 hover:text-white/80"
                onClick={() => setShowAllRecommenders((prev) => !prev)}
              >
                {showAllRecommenders ? "See less" : "See full list"}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-white/80 text-sm">None yet.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 p-4">
          <p className="text-xs text-white/50">Achievement score</p>
          <p className="text-lg text-green-400">
            {profile.achievement_total ?? "-"}
          </p>
        </div>
        <div className="border border-white/10 p-4">
          <p className="text-xs text-white/50">Recommendation score</p>
          <p className="text-lg text-purple-400">
            {profile.recommendation_total ?? "-"}
          </p>
        </div>
        <div className="border border-white/10 p-4">
          <p className="text-xs text-white/50">Caret score</p>
          <p className="text-lg text-white/80">
            ^{profile.caret_score ?? "-"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-white/60">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-purple-300">{post.type}</p>
                  <button
                    className="border border-white/30 px-3 py-1 rounded-full text-xs text-white/70"
                    disabled={currentUserId === profile.id}
                    onClick={async () => {
                      try {
                        const result = await togglePostCaret(post.id);
                        setPosts((prev) =>
                          prev.map((item) =>
                            item.id === post.id
                              ? { ...item, caret_count: result.caret_count }
                              : item
                          )
                        );
                      } catch (err) {
                        addToast("Unable to add caret.", "text-purple-300");
                      }
                    }}
                  >
                    ^{post.caret_count ?? 0}
                  </button>
                </div>
                <p className="text-sm text-white/80 mt-2">{post.content}</p>
                <p className="text-xs text-white/40 mt-2">{post.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md border border-white/10 bg-black p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Recommendation Request</h2>
              <p className="text-xs text-white/50">Requesting from {profile.full_name}</p>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setStatus("");
                try {
                  await requestRecommendation({
                    recommender_username: profile.username,
                    rec_type: recType,
                    reason
                  });
                  setStatus("Recommendation request sent");
                  addToast("Recommendation request sent");
                  setReason("");
                  setTimeout(() => {
                    setModalOpen(false);
                    setStatus("");
                  }, 1500);
                } catch (err: any) {
                  const detail = err?.response?.data?.detail;
                  setStatus(typeof detail === "string" ? detail : "Unable to request recommendation.");
                }
              }}
            >
              <select
                value={recType}
                onChange={(event) => setRecType(event.target.value)}
                className="bg-black border border-white/20 px-3 py-2 text-sm"
              >
                <option value="academic">Academic</option>
                <option value="professional">Professional</option>
                <option value="community">Community</option>
              </select>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                rows={3}
                placeholder="Reason"
                required
              />
              <div className="flex justify-between">
                <button
                  type="button"
                  className="border border-white/20 px-3 py-2 text-sm"
                  onClick={() => {
                    setModalOpen(false);
                    setStatus("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border border-white/20 px-3 py-2 text-sm hover:text-white/80"
                >
                  Request Recommendation
                </button>
              </div>
              {status ? <p className="text-xs text-white/50">{status}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
