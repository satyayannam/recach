import axios, { AxiosHeaders } from "axios";
import { clearAdminToken, clearToken, getAdminToken, getToken } from "./auth";
import type {
  AdminVerification,
  EducationCreate,
  EducationOut,
  EducationScoreOut,
  FeedItem,
  LeaderboardRow,
  PendingRecommendation,
  PublicUserOut,
  PublicUserSearchOut,
  ScoreOut,
  UserProfile,
  WorkCreate,
  WorkOut,
  WorkScoreOut
} from "./types";


const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const candidateBase = apiBase || apiBaseUrl;
const isLocalBase = /localhost|127\.0\.0\.1/.test(candidateBase);
const resolvedApiBase =
  process.env.NODE_ENV === "production" && isLocalBase
    ? apiBaseUrl && !/localhost|127\.0\.0\.1/.test(apiBaseUrl)
      ? apiBaseUrl
      : ""
    : candidateBase;

if (process.env.NODE_ENV === "production" && !resolvedApiBase) {
  console.warn("NEXT_PUBLIC_API_BASE is not set or points to localhost in production.");
}

const defaultHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0"
};





export const api = axios.create({
  baseURL: resolvedApiBase,
  headers: AxiosHeaders.from(defaultHeaders)
});



export const adminApi = axios.create({
  baseURL: resolvedApiBase,
  headers: AxiosHeaders.from(defaultHeaders)
});

const protectedPrefixes = ["/me", "/recommendations", "/education", "/work", "/users/me"];

const resolvePathname = (url?: string) => {
  if (!url) {
    return "";
  }

  try {
    const base = resolvedApiBase || "http://placeholder.local";
    return new URL(url, base).pathname;
  } catch {
    return url;
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();
  const path = resolvePathname(config.url);
  const requiresAuth = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  const headers = AxiosHeaders.from(config.headers);
  headers.set(defaultHeaders);
  if (token && requiresAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

adminApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  const headers = AxiosHeaders.from(config.headers);
  headers.set(defaultHeaders);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers = headers;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export async function login(usernameOrEmail: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", usernameOrEmail);
  body.append("password", password);

  const { data } = await api.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return data as { access_token: string; token_type: string };
}

export async function registerUser(payload: {
  full_name: string;
  email: string;
  password: string;
  username: string;
}) {
  const { data } = await api.post("/users", payload);
  return data;
}

export async function requestRecommendation(payload: {
  recommender_username: string;
  rec_type: string;
  reason: string;
}) {
  const { data } = await api.post("/recommendations/request", payload);
  return data;
}

export async function getFeed(limit = 50) {
  const { data } = await api.get("/feed", { params: { limit } });
  return data as FeedItem[];
}

export async function searchUsers(query: string, limit = 20) {
  const { data } = await api.get("/public/users/search", {
    params: { q: query, limit }
  });
  return data as PublicUserSearchOut[];
}

export async function getPublicProfile(username: string) {
  const { data } = await api.get(`/public/users/${encodeURIComponent(username)}`);
  return data as PublicUserOut;
}

export async function getLeaderboard(type: "recommendations" | "achievements", limit = 50) {
  const { data } = await api.get(`/leaderboard/${type}`, { params: { limit } });
  return data as LeaderboardRow[];
}

export async function getPendingRecommendations() {
  const { data } = await api.get("/recommendations/pending");
  return data as PendingRecommendation[];
}

export async function approveRecommendation(
  recommendationId: number,
  note_title: string,
  note_body: string
) {
  const { data } = await api.post(`/recommendations/${recommendationId}/approve`, {
    note_title,
    note_body
  });
  return data;
}

export async function rejectRecommendation(recommendationId: number) {
  const { data } = await api.post(`/recommendations/${recommendationId}/reject`);
  return data;
}

export async function getMyProfile() {
  const { data } = await api.get("/me/profile");
  return data as UserProfile;
}

export async function updateMyProfile(payload: Partial<UserProfile>) {
  const { data } = await api.put("/me/profile", payload);
  return data as UserProfile;
}

export async function getMyAchievementScore() {
  const { data } = await api.get("/users/me/achievement");
  return data as ScoreOut;
}

export async function getMyRecommendationScore() {
  const { data } = await api.get("/users/me/recommendation-score");
  return data as ScoreOut;
}

export async function addWork(payload: WorkCreate) {
  const { data } = await api.post("/work", payload);
  return data as WorkOut;
}

export async function getWorkScore(workId: number) {
  const { data } = await api.get(`/work/${workId}/score`);
  return data as WorkScoreOut;
}

export async function addEducation(payload: EducationCreate) {
  const { data } = await api.post("/education", payload);
  return data as EducationOut;
}

export async function getEducationScore(educationId: number) {
  const { data } = await api.get(`/education/${educationId}/score`);
  return data as EducationScoreOut;
}

export async function adminLogin(payload: { email: string; password: string }) {
  const { data } = await adminApi.post("/admin/auth/login", payload);
  return data as { access_token: string; token_type: string };
}

export async function getAdminVerifications(status = "PENDING") {
  const { data } = await adminApi.get("/admin/verifications", { params: { status } });
  return data as AdminVerification[];
}

export async function approveAdminVerification(requestId: number, admin_notes?: string) {
  const { data } = await adminApi.post(`/admin/verifications/${requestId}/approve`, {
    admin_notes
  });
  return data as AdminVerification;
}

export async function rejectAdminVerification(requestId: number, admin_notes?: string) {
  const { data } = await adminApi.post(`/admin/verifications/${requestId}/reject`, {
    admin_notes
  });
  return data as AdminVerification;
}
