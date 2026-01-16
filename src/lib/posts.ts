"use client";

import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PostOut, PostType } from "@/lib/types";

export type PostCreatePayload = {
  type: PostType;
  content: string;
};

export async function listPosts(limit = 50) {
  const { data } = await api.get("/posts", { params: { limit } });
  return data as PostOut[];
}

export async function createPost(payload: PostCreatePayload) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.post("/posts", payload, { headers });
  return data as PostOut;
}

export async function togglePostCaret(postId: number) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.post(`/posts/${postId}/caret`, null, { headers });
  return data as { post_id: number; caret_count: number; has_caret: boolean };
}

export async function deletePost(postId: number) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.delete(`/posts/${postId}`, { headers });
  return data as { status: string };
}
