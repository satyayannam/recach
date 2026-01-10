"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMyAchievementScore, getPublicProfile, requestRecommendation } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PublicUserOut } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

export const dynamic = "force-dynamic";

const PROFILE_REFRESH_MS = 30000;
const USER_REFRESH_MS = 30000;

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicUserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recType, setRecType] = useState("academic");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { addToast } = useToast();

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

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
        <p className="text-white/60 text-sm">^{profile.username}</p>
      </header>

      <div>
        <p className="text-sm text-white/50">Recommenders</p>
        <p className="text-white/80 text-sm">
          {profile.recommended_by?.length
            ? profile.recommended_by
                .map((rec) => `${rec.full_name} (${rec.username})`)
                .join(", ")
            : "None yet."}
        </p>
      </div>

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
