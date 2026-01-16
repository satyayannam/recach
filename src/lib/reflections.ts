"use client";

import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReflectionOut, ReflectionType } from "@/lib/types";

export type ReflectionCreatePayload = {
  type: ReflectionType;
  content: string;
};

export async function listReflections(limit = 50) {
  const { data } = await api.get("/reflections", { params: { limit } });
  return data as ReflectionOut[];
}

export async function getReflection(reflectionId: number) {
  const { data } = await api.get(`/reflections/${reflectionId}`);
  return data as ReflectionOut;
}

export async function createReflection(payload: ReflectionCreatePayload) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await api.post("/reflections", payload, { headers });
  return data as ReflectionOut;
}
