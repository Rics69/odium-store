"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Вы вышли");
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" onClick={logout}>
      Выйти
    </Button>
  );
}
