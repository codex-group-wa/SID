"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function AutoRefresh({ interval = 10000 }: { interval?: number }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [checkedCookie, setCheckedCookie] = useState(false);

  // Load initial state from cookie
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sid_autorefresh="));
    if (cookie) {
      setEnabled(cookie.split("=")[1] === "true");
    }
    setCheckedCookie(true);
  }, []);

  // Store state in cookie when changed
  useEffect(() => {
    document.cookie = `sid_autorefresh=${enabled}; path=/; max-age=31536000`;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const intervalId = setInterval(() => {
      router.refresh();
    }, interval);
    return () => clearInterval(intervalId);
  }, [router, interval, enabled]);

  if (!checkedCookie) return null;

  return (
    <div className="flex items-center gap-2 p-2">
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        id="autorefresh-switch"
      />
      <label htmlFor="autorefresh-switch" className="text-sm">
        Auto-refresh
      </label>
    </div>
  );
}