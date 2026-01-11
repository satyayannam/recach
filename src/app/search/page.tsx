"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMyAchievementScore,
  getPublicProfile,
  requestRecommendation,
  searchUsers
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PublicUserSearchOut } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

export const dynamic = "force-dynamic";

const SEARCH_REFRESH_MS = 15000;
const USER_REFRESH_MS = 30000;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<PublicUserSearchOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<PublicUserSearchOut | null>(null);
  const [recType, setRecType] = useState("academic");
  const [reason, setReason] = useState("");
  const [actionStatus, setActionStatus] = useState<string>("");
  const [universityMap, setUniversityMap] = useState<Record<string, string>>({});
  const [profilePhotoMap, setProfilePhotoMap] = useState<Record<string, string>>({});
  const [hasToken, setHasToken] = useState(Boolean(getToken()));
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { addToast } = useToast();
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  useEffect(() => {
    const handleAuth = () => setHasToken(Boolean(getToken()));
    window.addEventListener("recach-auth", handleAuth);
    window.addEventListener("storage", handleAuth);
    window.addEventListener("focus", handleAuth);
    return () => {
      window.removeEventListener("recach-auth", handleAuth);
      window.removeEventListener("storage", handleAuth);
      window.removeEventListener("focus", handleAuth);
    };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setActionStatus("");
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    let canceled = false;

    const loadCurrentUser = async () => {
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
      loadCurrentUser();
    }, USER_REFRESH_MS);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [hasToken]);

  useEffect(() => {
    let canceled = false;

    const loadResults = async (silent = false) => {
      if (!debouncedQuery) {
        setResults([]);
        if (!silent) {
          setLoading(false);
        }
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      try {
        const data = await searchUsers(debouncedQuery, 20);
        if (!canceled) {
          setResults(data ?? []);
        }
      } catch (err) {
        if (!canceled) {
          setResults([]);
        }
      } finally {
        if (!silent && !canceled) {
          setLoading(false);
        }
      }
    };

    loadResults();
    if (!debouncedQuery) {
      return () => {
        canceled = true;
      };
    }

    const interval = setInterval(() => {
      loadResults(true);
    }, SEARCH_REFRESH_MS);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (!results.length || typeof window === "undefined") {
      return;
    }

    let nextCache: Record<string, { achievement_total?: number; recommendation_total?: number }>;
    try {
      nextCache = JSON.parse(localStorage.getItem("recach-search-scores") ?? "{}");
    } catch {
      nextCache = {};
    }
    results.forEach((user) => {
      const prev = nextCache[user.user_id] ?? {};
      if (user.achievement_total > (prev.achievement_total ?? 0)) {
        addToast(
          `+${user.achievement_total - (prev.achievement_total ?? 0)} Achievement points added`,
          "text-green-400"
        );
      }
      if (user.recommendation_total > (prev.recommendation_total ?? 0)) {
        addToast(
          `+${user.recommendation_total - (prev.recommendation_total ?? 0)} Recommendation points added`,
          "text-purple-400"
        );
      }
      nextCache[user.user_id] = {
        achievement_total: user.achievement_total,
        recommendation_total: user.recommendation_total
      };
    });
    localStorage.setItem("recach-search-scores", JSON.stringify(nextCache));
  }, [results, addToast]);

  const loadPublicDetails = async (username?: string) => {
    if (!username) {
      return;
    }
    if (universityMap[username]) {
      return;
    }
    try {
      const data = await getPublicProfile(username);
      const university =
        (data as any).university_name ??
        (Array.isArray((data as any).university_names)
          ? String((data as any).university_names[0])
          : null) ??
        "Unknown University";
      setUniversityMap((prev) => ({ ...prev, [username]: university }));
      if (data.profile_photo_url) {
        const resolved =
          data.profile_photo_url.startsWith("http")
            ? data.profile_photo_url
            : `${apiBase}${data.profile_photo_url}`;
        setProfilePhotoMap((prev) => ({ ...prev, [username]: resolved }));
      }
    } catch (err) {
      setUniversityMap((prev) => ({ ...prev, [username]: "Unknown University" }));
    }
  };

  const openModal = (user: PublicUserSearchOut) => {
    setModalUser(user);
    setRecType("academic");
    setReason("");
    setActionStatus("");
    setModalOpen(true);
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-white/60 text-sm">
          Find public profiles by ^username.
        </p>
      </div>

      <div className="max-w-md space-y-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
          placeholder="^username"
        />
        {loading ? (
          <p className="text-sm text-white/60">Searching...</p>
        ) : null}
      </div>

      <div className="space-y-3">
        {query.trim().startsWith("^") && query.trim().length > 1 ? (
          <Link
            href={`/u/${encodeURIComponent(query.trim())}`}
            className="block border border-white/20 px-3 py-2 text-sm hover:text-white/80"
          >
            Go to profile {query.trim()}
          </Link>
        ) : null}

        {results.map((user) => {
          const username = user.username ? `^${user.username}` : "username unavailable";
          const canRecommend = hasToken;
          const isSelf = currentUserId !== null && user.user_id === currentUserId;
          const estimatedPoints = Math.max(5, Math.round(user.achievement_total * 0.1) + 5);
          const university = user.username
            ? universityMap[user.username] ?? "Unknown University"
            : "Unknown University";
          const profilePhoto = user.username ? profilePhotoMap[user.username] : "";

          return (
            <div
              key={`${user.user_id}-${user.full_name}`}
              className="relative border-b border-white/10 pb-3"
              onMouseEnter={() => {
                setHoveredId(user.user_id);
                loadPublicDetails(user.username);
              }}
              onMouseLeave={() => setHoveredId((prev) => (prev === user.user_id ? null : prev))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">{user.full_name}</p>
                  <p className="text-white/60 text-xs mono">{username}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-green-400">Achievement {user.achievement_total}</p>
                  <p className="text-purple-400">Recommendation {user.recommendation_total}</p>
                </div>
              </div>

              {user.username ? (
                <Link
                  href={`/u/${encodeURIComponent(user.username)}`}
                  className="text-xs text-white/60 hover:text-white/80"
                >
                  View profile
                </Link>
              ) : null}

              {hoveredId === user.user_id ? (
                <div className="absolute z-10 mt-3 w-full border border-white/10 bg-black p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-black">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt={`${user.full_name} photo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-white/40">
                          No photo
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white/80">{user.full_name}</p>
                      <p className="text-xs text-white/50">{username}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mb-2">Public details</p>
                  {user.headline ? (
                    <p className="text-sm text-white/80">{user.headline}</p>
                  ) : (
                    <p className="text-sm text-white/50">No public headline.</p>
                  )}
                  <p className="text-xs text-white/50 mt-2">University: {university}</p>
                  <p className="text-xs text-white/50 mt-3">
                    Estimated score impact:{" "}
                    <span className="text-white/80">+{estimatedPoints} points</span>
                  </p>
                  <p className="text-xs text-white/40">Estimated only.</p>

                  {canRecommend ? (
                    <button
                      type="button"
                      className={`mt-4 border border-white/20 px-3 py-1 text-xs ${
                        user.username && !isSelf
                          ? "hover:text-white/80"
                          : "text-white/40 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (isSelf) {
                          setActionStatus("You cannot request a recommendation from yourself.");
                        } else if (user.username) {
                          openModal(user);
                        } else {
                          setActionStatus("Username unavailable.");
                        }
                      }}
                    >
                      Request Recommendation
                    </button>
                  ) : (
                    <p className="text-xs text-white/50 mt-3">
                      Login to request recommendation.
                    </p>
                  )}
                  {actionStatus ? (
                    <p className="text-xs text-white/50 mt-2">{actionStatus}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {!loading && query && results.length === 0 ? (
          <p className="text-sm text-white/60">No results found.</p>
        ) : null}
      </div>

      {modalOpen && modalUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md border border-white/10 bg-black p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Recommendation Request</h2>
              <p className="text-xs text-white/50">
                Requesting from {modalUser.full_name}
              </p>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!modalUser.username) {
                  setActionStatus("Username unavailable.");
                  return;
                }
                setActionStatus("Submitting...");
                try {
                  await requestRecommendation({
                    recommender_username: modalUser.username,
                    rec_type: recType,
                    reason
                  });
                  setActionStatus("Recommendation request sent");
                  addToast("Recommendation request sent");
                  setTimeout(() => {
                    setModalOpen(false);
                    setModalUser(null);
                    setActionStatus("");
                  }, 1500);
                } catch (err: any) {
                  const detail = err?.response?.data?.detail;
                  setActionStatus(
                    typeof detail === "string" ? detail : "Unable to request recommendation."
                  );
                }
              }}
            >
              <select
                value={recType}
                onChange={(event) => setRecType(event.target.value)}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
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
                    setModalUser(null);
                    setActionStatus("");
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
              {actionStatus ? <p className="text-xs text-white/50">{actionStatus}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
