"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {mounted ? (
        isDark ? (
          <SunIcon className="size-4.5" />
        ) : (
          <MoonIcon className="size-4.5" />
        )
      ) : (
        <span className="size-4.5" />
      )}
    </button>
  );
}
