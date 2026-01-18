"use client";

import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  PostOut,
  PostReplyOut,
  PostReplyOwnerReaction,
  PostReplyType,
  PostType
} from "@/lib/types";

export type PostCreatePayload = {
  type: PostType;
  content: string;
};

export async function listPosts(limit = 50) {
  const { data } = await api.get("/posts", { params: { limit } });
  return data as PostOut[];
}

export async function listPostsByUser(userId: number, limit = 50) {
  const { data } = await api.get("/posts", { params: { limit, user_id: userId } });
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

export async function updatePost(postId: number, payload: PostCreatePayload) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.put(`/posts/${postId}`, payload, { headers });
  return data as PostOut;
}

export async function createPostReply(
  postId: number,
  payload: { type: PostReplyType; message: string; recipient_id?: number | null }
) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.post(`/posts/${postId}/replies`, payload, { headers });
  return data as PostReplyOut;
}

export async function listPostReplies(postId: number) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.get(`/posts/${postId}/replies`, { headers });
  return data as PostReplyOut[];
}

export async function togglePostReplyCaret(replyId: number) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.post(`/post-replies/${replyId}/caret`, null, { headers });
  return data as { reply_id: number; is_given: boolean };
}

export async function setPostReplyOwnerReaction(
  replyId: number,
  reaction: PostReplyOwnerReaction
) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.post(
    `/post-replies/${replyId}/owner-reaction`,
    { reaction },
    { headers }
  );
  return data as { reply_id: number; reaction: PostReplyOwnerReaction };
}
