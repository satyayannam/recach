"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";

type FormErrors = {
  username?: string;
  email?: string;
  general?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const parseError = (err: any) => {
    const nextErrors: FormErrors = { general: "Registration failed." };
    const detail = err?.response?.data?.detail;
    const detailText = typeof detail === "string" ? detail.toLowerCase() : "";

    if (detailText.includes("username")) {
      nextErrors.username = "Username already taken.";
      nextErrors.general = undefined;
    }
    if (detailText.includes("email")) {
      nextErrors.email = "Email already in use.";
      nextErrors.general = undefined;
    }

    const errorMap = err?.response?.data?.errors;
    if (errorMap?.username) {
      nextErrors.username = errorMap.username;
      nextErrors.general = undefined;
    }
    if (errorMap?.email) {
      nextErrors.email = errorMap.email;
      nextErrors.general = undefined;
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    if (!username.startsWith("^")) {
      setErrors({ username: "Username must start with ^." });
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        email,
        username,
        full_name: fullName,
        password
      });
      router.push("/login");
    } catch (err) {
      setErrors(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="text-white/60 text-sm">
          Create your recach^ account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Full name</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
            required
          />
          {errors.email ? (
            <p className="text-sm text-white/60">{errors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
            placeholder="^username"
            required
          />
          {errors.username ? (
            <p className="text-sm text-white/60">{errors.username}</p>
          ) : null}
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

        {errors.general ? (
          <p className="text-sm text-white/60">{errors.general}</p>
        ) : null}

        <button
          type="submit"
          className="border border-white/20 px-4 py-2 text-sm hover:text-white/80"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </section>
  );
}
