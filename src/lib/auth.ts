const TOKEN_KEY = "access_token";
const ADMIN_TOKEN_KEY = "admin_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("recach-auth"));
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("recach-auth"));
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  window.dispatchEvent(new Event("recach-auth"));
}

export function clearAdminToken() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.dispatchEvent(new Event("recach-auth"));
}
