"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { PersonalDataConsentField } from "@/components/personal-data-consent-field";
import { useCookieConsent } from "@/components/cookie-consent-context";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdConsent, setPdConsent] = useState(false);
  const { canUseCookies } = useCookieConsent();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseCookies) {
      toast.error("Примите cookie в плашке внизу справа, чтобы зарегистрироваться.");
      return;
    }
    if (!pdConsent) {
      toast.error("Подтвердите согласие на обработку персональных данных.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg = "Ошибка регистрации";
        const d = (data as { detail?: unknown }).detail;
        if (typeof d === "string") msg = d;
        else if (Array.isArray(d))
          msg = d
            .map((item) =>
              typeof item === "object" &&
              item !== null &&
              "msg" in item
                ? String((item as { msg: string }).msg)
                : String(item)
            )
            .join("; ");
        throw new Error(msg);
      }
      toast.success("Аккаунт создан");
      router.push("/account");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
          новый аккаунт
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Создать аккаунт
        </h1>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/70 bg-card/60 p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.5)]"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Имя</Label>
          <Input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <PersonalDataConsentField
          id="register-pd-consent"
          checked={pdConsent}
          onCheckedChange={setPdConsent}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Создаём…" : "Создать аккаунт"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link className="text-primary underline underline-offset-2" href="/login">
          Вход
        </Link>
      </p>
    </div>
  );
}
