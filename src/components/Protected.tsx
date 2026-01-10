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

    const validate = async () => {
      try {
        await getMyAchievementScore();
        setReady(true);
      } catch (err) {
        clearToken();
        router.replace("/login");
      }
    };

    validate();
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
