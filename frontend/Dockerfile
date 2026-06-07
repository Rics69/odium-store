# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmmirror.com

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_REGISTRY=${NPM_REGISTRY} \
    NPM_CONFIG_FETCH_TIMEOUT=600000 \
    NPM_CONFIG_FETCH_RETRIES=10 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

COPY package.json package-lock.json ./

# На VPS с медленным доступом к registry.npmjs.org установка 600+ пакетов
# может занять 30-60 минут. Зеркало npm сильно ускоряет первую сборку.
RUN --mount=type=cache,target=/root/.npm \
    echo ">>> npm ci: start (registry=${NPM_REGISTRY})" \
    && npm ci --no-audit --no-fund \
    && echo ">>> npm ci: done"

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NODE_OPTIONS="--max-old-space-size=1536"

RUN --mount=type=cache,target=/app/.next/cache \
    echo ">>> next build: start" \
    && npm run build \
    && echo ">>> next build: done"

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
