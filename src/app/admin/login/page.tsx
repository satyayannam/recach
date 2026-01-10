"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api";
import { setAdminToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin({ email, password });
      setAdminToken(data.access_token);
      router.push("/admin/verifications");
    } catch (err) {
      setError("Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <p className="text-white/60 text-sm">Use admin credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
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
