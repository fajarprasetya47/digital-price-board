"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { LoginIcon } from "@/components/ui/icons";
import { Input, Field } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/feedback";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await fetchJSON("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      router.replace("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {error && <ErrorMessage message={error} />}
      <Field label="Email">
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@example.com"
        />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <Button type="submit" loading={loading} className="w-full">
        <LoginIcon />
        Masuk
      </Button>
      <p className="text-center text-xs text-zinc-500">
        Demo: owner@example.com / owner123
      </p>
    </form>
  );
}