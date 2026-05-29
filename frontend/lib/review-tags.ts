export const REVIEW_TAG_OPTIONS = [
  "Высокая скорость",
  "Отличная поддержка",
  "Всё как обещали",
  "Удобная оплата",
  "Рекомендую",
] as const;

export type ReviewTag = (typeof REVIEW_TAG_OPTIONS)[number];
