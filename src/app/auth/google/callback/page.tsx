"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile, loginWithGoogle } from "@/lib/api";
import { setToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      setError("Missing Google authorization code.");
      return;
    }

    const exchange = async () => {
      try {
        const data = await loginWithGoogle(code);
        if (data?.access_token) {
          setToken(data.access_token);
          try {
            const profile = await getMyProfile();
            if (!profile?.username) {
              router.replace("/onboarding");
            } else {
              router.replace("/");
            }
          } catch (profileErr: any) {
            if (profileErr?.response?.status === 404) {
              router.replace("/onboarding");
            } else {
              setError("Unable to load your profile.");
            }
          }
        } else {
          setError("No token returned from server.");
        }
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Unable to sign in with Google.");
      }
    };

    exchange();
  }, [router]);

  return (
    <section className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Signing you in...</h1>
      {error ? <p className="text-sm text-white/60">{error}</p> : null}
    </section>
  );
}
