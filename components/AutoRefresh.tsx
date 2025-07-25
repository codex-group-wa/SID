"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ interval = 10000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh(); // Refreshes server components
    }, interval);

    return () => clearInterval(intervalId);
  }, [router, interval]);

  return null;
}
