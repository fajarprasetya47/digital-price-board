"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/client/api";
import { LogoutIcon } from "@/components/ui/icons";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetchJSON("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
    >
      <LogoutIcon />
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}