"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReflectionComposer from "@/components/reflection/ReflectionComposer";
import ReflectionCard from "@/components/reflection/ReflectionCard";
import { useToast } from "@/components/ToastProvider";
import { getToken } from "@/lib/auth";
import { createReflection, listReflections } from "@/lib/reflections";
import { createPost, deletePost, listPosts, togglePostCaret, updatePost } from "@/lib/posts";
import { getMyProfile } from "@/lib/api";
import type { PostOut, PostType, ReflectionOut } from "@/lib/types";

const POST_TYPES: Array<{ id: PostType; label: string }> = [
  { id: "behind_resume", label: "Behind My Resume" },
  { id: "this_lately", label: "This Lately" },
  { id: "recent_realization", label: "Recent Realization" },
  { id: "currently_building", label: "Currently Building" }
];

const ROTATE_MS = 60000;
const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_MS = 30000;

const getPreview = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.length <= 160) {
    return trimmed;
  }
  return `${trimmed.slice(0, 160)}...`;
};

const normalizeTimestamp = (value: string) => {
  if (/z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  return `${value}Z`;
};

export default function ReflectionPage() {
  const { addToast } = useToast();
  const [reflections, setReflections] = useState<ReflectionOut[]>([]);
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<PostType | "reflection" | "">("");
  const [content, setContent] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [caretSelections, setCaretSelections] = useState<Record<number, boolean>>({});
  const [now, setNow] = useState(Date.now());
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const loadReflections = useCallback(async () => {
    setLoading(true);
    try {
      const [reflectionData, postData] = await Promise.all([
        listReflections(50),
        listPosts(50)
      ]);
      setReflections(reflectionData);
      setPosts(postData);
      setCaretSelections((prev) => {
        const next = { ...prev };
        postData.forEach((post) => {
          if (post.has_caret) {
            next[post.id] = true;
          }
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const profile = await getMyProfile();
      setCurrentUser({ id: profile.user_id, username: profile.username ?? "me" });
    } catch {
      setCurrentUser({ id: -1, username: "me" });
    }
  }, []);

  useEffect(() => {
    loadReflections();
    const interval = setInterval(() => {
      loadReflections();
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadReflections]);

  useEffect(() => {
    resolveAuth();
    const handler = () => {
      resolveAuth();
    };
    window.addEventListener("storage", handler);
    window.addEventListener("recach-auth", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("recach-auth", handler);
    };
  }, [resolveAuth]);

  const reflectionsInWindow = useMemo(() => {
    const cutoff = Date.now() - STORY_TTL_MS;
    return reflections.filter(
      (reflection) => Date.parse(normalizeTimestamp(reflection.created_at)) >= cutoff
    );
  }, [reflections]);

  useEffect(() => {
    if (reflectionsInWindow.length === 0) {
      return;
    }
    const timer = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % reflectionsInWindow.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [reflectionsInWindow.length]);

  useEffect(() => {
    if (rotatingIndex >= reflectionsInWindow.length) {
      setRotatingIndex(0);
    }
  }, [reflectionsInWindow.length, rotatingIndex]);

  useEffect(() => {
    if (!carouselRef.current) {
      return;
    }
    const container = carouselRef.current;
    const target = container.querySelector<HTMLDivElement>(
      `[data-carousel-index="${rotatingIndex}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  }, [rotatingIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCaret = async (postId: number) => {
    if (!currentUser) {
      addToast("Login to add a caret.", "text-purple-300");
      return;
    }
    try {
      const result = await togglePostCaret(postId);
      setPosts((prev) =>
        prev.map((item) =>
          item.id === postId ? { ...item, caret_count: result.caret_count } : item
        )
      );
      setCaretSelections((prev) => ({ ...prev, [postId]: result.has_caret }));
    } catch {
      addToast("Unable to update caret.", "text-purple-300");
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((item) => item.id !== postId));
      addToast("Post deleted", "text-purple-300");
    } catch {
      addToast("Unable to delete post.", "text-purple-300");
    }
  };

  const handleEdit = async (postId: number, content: string) => {
    try {
      const post = posts.find((item) => item.id === postId);
      if (!post) {
        return;
      }
      const updated = await updatePost(postId, { type: post.type, content });
      setPosts((prev) => prev.map((item) => (item.id === postId ? updated : item)));
      addToast("Post updated", "text-purple-300");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      addToast(typeof detail === "string" ? detail : "Unable to update post.", "text-purple-300");
    }
  };

  const formatTimeLeft = (createdAt: string) => {
    const created = Date.parse(normalizeTimestamp(createdAt));
    if (Number.isNaN(created)) {
      return "";
    }
    const remainingMs = Math.max(0, created + STORY_TTL_MS - now);
    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) {
      return `${minutes}m left`;
    }
    if (minutes === 0) {
      return `${hours}h left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      return;
    }
    if (!activeType) {
      addToast("Select a post type or reflection.", "text-purple-300");
      return;
    }
    const trimmed = content.trim();
    if (trimmed.length < 20) {
      addToast("Reflection must be 20+ characters.", "text-purple-300");
      return;
    }
    try {
      if (activeType === "reflection") {
        const created = await createReflection({ type: "story", content: trimmed });
        setReflections((prev) => [created, ...prev]);
      } else {
        const created = await createPost({ type: activeType, content: trimmed });
        setPosts((prev) => [created, ...prev]);
      }
      setContent("");
      addToast("Posted", "text-purple-300");
    } catch {
      addToast("Unable to post right now.", "text-purple-300");
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-4 border border-white/10 rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>
            <span className="text-purple-300">r</span>eflection
          </span>
          <div className="flex gap-2">
            <button
              className="border border-white/20 px-2 text-white/70"
              onClick={() =>
                setRotatingIndex((prev) =>
                  reflectionsInWindow.length
                    ? (prev - 1 + reflectionsInWindow.length) % reflectionsInWindow.length
                    : 0
                )
              }
            >
              &lt;
            </button>
            <button
              className="border border-white/20 px-2 text-white/70"
              onClick={() =>
                setRotatingIndex((prev) =>
                  reflectionsInWindow.length
                    ? (prev + 1) % reflectionsInWindow.length
                    : 0
                )
              }
            >
              &gt;
            </button>
          </div>
        </div>
        {reflectionsInWindow.length > 0 ? (
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
          >
            {reflectionsInWindow.map((reflection, index) => (
              <div
                key={reflection.id}
                data-carousel-index={index}
                className="min-w-[220px] max-w-[280px] sm:min-w-[260px] sm:max-w-[320px] shrink-0 snap-start text-left border border-white/10 rounded-2xl px-4 py-3 space-y-2 transition-transform duration-200 hover:scale-105"
              >
                <div className="text-sm text-white">
                  <a
                    href={`/u/${encodeURIComponent(reflection.user.username)}`}
                    className="hover:text-white/80"
                  >
                    @{reflection.user.username}
                  </a>
                  {reflection.user.university ? (
                    <span className="text-white/50"> · {reflection.user.university}</span>
                  ) : null}
                </div>
                <div className="text-[11px] text-purple-300">Reflection</div>
                <p className="text-sm text-white/80">{getPreview(reflection.content)}</p>
                <div className="text-[11px] text-white/40">
                  {formatTimeLeft(reflection.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">
            {loading ? "Loading reflections..." : "No reflections yet."}
          </p>
        )}
        <ReflectionComposer
          value={content}
          onChange={setContent}
          onSubmit={handleSubmit}
          typeValue={activeType}
          onTypeChange={(value) => setActiveType(value as PostType | "reflection" | "")}
          typeOptions={[
            { value: "reflection", label: "Reflection (24h story)", accent: true },
            ...POST_TYPES.map((tab) => ({ value: tab.id, label: tab.label }))
          ]}
          disabled={!currentUser}
        />
        <p className="text-xs text-white/50">
          Write your post or reflection, choose a type, then press &gt; to post.
        </p>
        {!currentUser ? (
          <p className="text-xs text-white/60">Login to post.</p>
        ) : null}
      </div>

      <div className="space-y-5">
        {posts.map((post) => {
          const label = POST_TYPES.find((tab) => tab.id === post.type)?.label ?? post.type;
          const isOwner = currentUser ? post.user.id === currentUser.id : false;
          return (
            <div key={post.id} ref={(el) => (cardRefs.current[post.id] = el)}>
              <ReflectionCard
                reflection={post}
                label={label}
                onToggleCaret={handleToggleCaret}
                caretActive={Boolean(caretSelections[post.id])}
                caretDisabled={isOwner}
                canDelete={isOwner}
                onDelete={handleDelete}
                canEdit={isOwner}
                onEdit={handleEdit}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
