"use client";

export function HeroScrollCue() {
  function scrollToCatalog() {
    document
      .getElementById("catalog")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={scrollToCatalog}
      aria-label="Перейти к каталогу"
      className="group absolute inset-x-0 bottom-8 z-20 mx-auto flex w-fit cursor-pointer flex-col items-center gap-2 outline-none"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-muted-foreground transition-colors duration-300 group-hover:text-primary">
        купить
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="odium-bob size-5 text-primary"
        aria-hidden
      >
        <path d="M12 5v14" />
        <path d="m6 13 6 6 6-6" />
      </svg>
    </button>
  );
}
