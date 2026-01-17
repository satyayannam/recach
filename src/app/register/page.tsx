"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");

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

  return (
    <section className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="text-white/60 text-sm">
          Continue with Google to create your recach^ account.
        </p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full border border-white/20 px-4 py-2 text-sm hover:text-white/80"
        >
          Continue with Google
        </button>
        {error ? <p className="text-sm text-white/60">{error}</p> : null}
      </div>
    </section>
  );
}
