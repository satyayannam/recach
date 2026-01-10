"use client";

import { useEffect, useRef, useState } from "react";
import FeedItem from "@/components/FeedItem";
import { getFeed, getMyProfile } from "@/lib/api";
import type { FeedItem as FeedItemType } from "@/lib/types";

export default function HomePage() {
  const [items, setItems] = useState<FeedItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const universityCache = useRef(new Map<number, string>());
  const [myUserId, setMyUserId] = useState<number | null>(null);

  const loadFeed = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFeed(50);
      setItems(data ?? []);
    } catch (err) {
      setError("Unable to load feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();
        setMyUserId(profile.user_id);
        const university =
          Array.isArray(profile.university_names) && profile.university_names.length > 0
            ? String(profile.university_names[0])
            : null;
        if (university) {
          universityCache.current.set(profile.user_id, university);
        }
      } catch (err) {
        setMyUserId(null);
      }
    };

    loadProfile();
  }, []);

  const resolveUniversity = (userId?: number) => {
    if (!userId) {
      return "Unknown University";
    }
    return universityCache.current.get(userId) ?? "Unknown University";
  };

  const buildMessage = (item: FeedItemType) => {
    if (item.type === "recommendation") {
      const receiverId = (item.payload?.receiver_id as number | undefined) ?? item.user?.id;
      const parsed = typeof item.message === "string" ? item.message.split(" recommended ") : [];
      const fallbackRecommender = parsed.length === 2 ? parsed[0] : null;
      const fallbackReceiver = parsed.length === 2 ? parsed[1] : null;
      const receiverName = item.user?.full_name ?? fallbackReceiver ?? "Someone";
      const receiverUniversity =
        (item.payload?.receiver_university as string | undefined) ??
        (item.payload?.receiver_school as string | undefined) ??
        resolveUniversity(receiverId);
      const recommenderName =
        typeof item.payload?.recommender_name === "string"
          ? item.payload.recommender_name
          : fallbackRecommender ?? "A recommender";
      const recommenderId = item.payload?.recommender_id as number | undefined;
      const recommenderUniversity =
        (item.payload?.recommender_university as string | undefined) ??
        (item.payload?.recommender_school as string | undefined) ??
        resolveUniversity(recommenderId);

      if (receiverId && myUserId && receiverId === myUserId) {
        return `${receiverName} from ${receiverUniversity} got recommended by ${recommenderName} from ${recommenderUniversity}`;
      }

      return `${receiverName} from ${receiverUniversity} got recommended by ${recommenderName} from ${recommenderUniversity}`;
    }

    return item.message;
  };

  const displayItems = items.map((item) => ({
    ...item,
    message: buildMessage(item)
  }));

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Feed</h1>
          <p className="text-white/60 text-sm">
            Live approvals and recommendations.
          </p>
        </div>
        <button
          onClick={loadFeed}
          className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="border-t border-white/10">
        {displayItems.map((item, index) => (
          <FeedItem key={`${item.type}-${item.timestamp}-${index}`} item={item} index={index} />
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <p className="text-white/60 text-sm">No feed items yet.</p>
      ) : null}
      {error ? <p className="text-white/60 text-sm">{error}</p> : null}
    </section>
  );
}
