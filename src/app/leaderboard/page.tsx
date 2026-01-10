"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/api";
import type { LeaderboardRow } from "@/lib/types";

type LeaderboardType = "recommendations" | "achievements";

export const dynamic = "force-dynamic";

const LEADERBOARD_REFRESH_MS = 30000;

const ACCENT_COLORS = [
  "text-blue-400",
  "text-green-400",
  "text-purple-400",
  "text-amber-400",
  "text-teal-400"
];

export default function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("recommendations");
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    const loadLeaderboard = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        const data = await getLeaderboard(type, 50);
        if (!canceled) {
          setEntries(data ?? []);
        }
      } catch (err) {
        if (!canceled) {
          setEntries([]);
        }
      } finally {
        if (!silent && !canceled) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();
    const interval = setInterval(() => {
      loadLeaderboard(true);
    }, LEADERBOARD_REFRESH_MS);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [type]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-white/60 text-sm">
          Ranked by recommendation or achievement points.
        </p>
      </header>

      <div className="flex gap-4 text-sm">
        <button
          onClick={() => setType("recommendations")}
          className={
            type === "recommendations"
              ? "underline text-white"
              : "text-white/60"
          }
        >
          Recommendations
        </button>
        <button
          onClick={() => setType("achievements")}
          className={
            type === "achievements" ? "underline text-white" : "text-white/60"
          }
        >
          Achievements
        </button>
      </div>

      <div className="border-t border-white/10">
        {loading ? (
          <p className="text-sm text-white/60 py-4">Loading...</p>
        ) : null}
        {!loading && (entries ?? []).length === 0 ? (
          <p className="text-sm text-white/60 py-4">No entries yet.</p>
        ) : null}
        {(entries ?? []).map((entry, index) => {
          const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
          const scoreClass =
            type === "recommendations" ? "text-purple-400" : "text-green-400";
          return (
            <div key={`${entry.user.id}-${entry.rank}`} className="py-3 border-b border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-white/60">#{entry.rank}</span>
                <div>
                  <p className={`${accent}`}>{entry.user.full_name}</p>
                </div>
              </div>
              <span className={scoreClass}>{entry.score}</span>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
