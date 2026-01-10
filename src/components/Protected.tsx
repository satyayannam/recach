"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyAchievementScore } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let canceled = false;
    const validate = async () => {
      try {
        await getMyAchievementScore();
        if (!canceled) {
          setReady(true);
        }
      } catch (err) {
        if (!canceled) {
          clearToken();
          router.replace("/login");
        }
      }
    };

    validate();
    const interval = setInterval(validate, 60000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
