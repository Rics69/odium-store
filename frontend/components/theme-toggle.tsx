"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button type="button" size="icon-sm" variant="ghost" disabled aria-label="Тема">
        <MoonIcon className="size-5 opacity-40" aria-hidden />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="rounded-lg"
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <SunIcon className="size-5" aria-hidden />
      ) : (
        <MoonIcon className="size-5" aria-hidden />
      )}
    </Button>
  );
}
