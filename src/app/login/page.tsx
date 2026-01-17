"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
    if (!clientId) {
      setError("Google Client ID is missing.");
      return;
    }
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account"
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(identifier, password);
      const token = data.access_token;
      if (!token) {
        setError("No token returned from server.");
      } else {
        setToken(token);
        router.push("/");
      }
    } catch (err) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-white/60 text-sm">
          Use your email or ^username.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full border border-white/20 px-4 py-2 text-sm hover:text-white/80"
        >
          Continue with Google
        </button>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Email or ^username</label>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
            placeholder="you@example.com or ^username"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
            required
          />
        </div>
        {error ? <p className="text-sm text-white/60">{error}</p> : null}
        <button
          type="submit"
          className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

    </section>
  );
}
