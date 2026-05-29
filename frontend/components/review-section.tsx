"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TrashIcon } from "@heroicons/react/24/outline";
import { PersonalDataConsentField } from "@/components/personal-data-consent-field";
import { useCookieConsent } from "@/components/cookie-consent-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StarRatingDisplay, StarRatingPicker } from "@/components/star-rating";
import { REVIEW_TAG_OPTIONS } from "@/lib/review-tags";
import { formatApiErrorDetail, readJsonSafe } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";

type ReviewRead = {
  id: string;
  rating: number;
  text: string;
  tags?: string[];
  created_at: string;
  display_name: string;
  avatar_url: string | null;
};

export function ReviewSection({
  slug,
  initialReviews,
  isLoggedIn,
  canReview,
  isAdmin,
}: {
  slug: string;
  initialReviews: ReviewRead[];
  isLoggedIn: boolean;
  canReview: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [pdConsent, setPdConsent] = useState(false);
  const { canUseCookies } = useCookieConsent();

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && tags.length === 0) {
      toast.error("Выберите плашки или напишите отзыв");
      return;
    }
    if (!canUseCookies) {
      toast.error("Примите cookie в плашке внизу справа.");
      return;
    }
    if (!pdConsent) {
      toast.error("Подтвердите согласие на обработку персональных данных.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ slug, rating, text: trimmed, tags }),
      });
      const payload = await readJsonSafe<ReviewRead & { detail?: unknown }>(res);
      if (!res.ok) {
        throw new Error(formatApiErrorDetail(payload ?? {}));
      }
      if (payload?.id) {
        setReviews((prev) => [payload as ReviewRead, ...prev]);
      }
      setText("");
      setTags([]);
      toast.success("Отзыв добавлен");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function removeReview(id: string) {
    if (!confirm("Удалить этот отзыв?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const payload = await readJsonSafe<{ detail?: unknown }>(res);
      if (!res.ok) throw new Error(formatApiErrorDetail(payload ?? {}));
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Отзыв удалён");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <Separator />
      <h2 className="text-xl font-semibold">Отзывы</h2>
      {canReview && isLoggedIn ? (
        <form onSubmit={submitReview} className="space-y-3 rounded-xl border p-4">
          <div className="space-y-2">
            <Label>Оценка</Label>
            <StarRatingPicker value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label>Плашки</Label>
            <p className="text-muted-foreground text-xs">
              Можно выбрать несколько — текст необязателен.
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAG_OPTIONS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rev-text">Свой комментарий (необязательно)</Label>
            <Textarea
              id="rev-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Дополните отзыв, если хотите"
            />
          </div>
          <PersonalDataConsentField
            id="review-pd-consent"
            checked={pdConsent}
            onCheckedChange={setPdConsent}
          />
          <Button type="submit" disabled={loading}>
            Отправить отзыв
          </Button>
          <p className="text-muted-foreground text-xs">
            Отзыв доступен после успешной покупки (проверяется на сервере).
          </p>
        </form>
      ) : null}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">Пока нет отзывов.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.display_name}</span>
                    <StarRatingDisplay rating={r.rating} size="sm" />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {new Date(r.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
                {isAdmin ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label="Удалить отзыв"
                    onClick={() => removeReview(r.id)}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                ) : null}
              </div>
              {(r.tags?.length ?? 0) > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.tags!.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {r.text ? (
                <p className="mt-3 whitespace-pre-wrap text-sm">{r.text}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
