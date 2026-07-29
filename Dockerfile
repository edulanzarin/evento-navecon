# syntax=docker/dockerfile:1

# ── Build stage: install every dep and compile the Vite/React SPA ─────────
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Guarda de Git LFS: as mídias (public/assets/**) são versionadas via LFS. Se o
# servidor não rodou `git lfs pull` antes do build, elas chegam aqui como
# ponteiros de texto (~130 bytes começando com "version https://git-lfs..."), e
# a landing subiria SEM as mídias. Falha alto e explicado em vez de silencioso.
RUN if head -c 60 public/assets/video/background.mp4 | grep -q "git-lfs"; then \
      echo "ERRO: mídias em public/assets são ponteiros do Git LFS. Rode 'git lfs pull' no servidor ANTES do build (docker compose ... up -d --build)." >&2; \
      exit 1; \
    fi

# Vite inlines the base path at build time. Pass APP_BASE_PATH to serve under a
# subpath (e.g. /imersao/); assets, the registration endpoint and the payment
# return route all derive from it. Defaults to the domain root.
ARG APP_BASE_PATH=/
ENV APP_BASE_PATH=$APP_BASE_PATH
RUN npm run build

# ── Runtime stage: production deps + Node server that serves the SPA + API ─
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only runtime deps (express, pg, nodemailer, tsx, dotenv…); no build tooling.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Server source (run directly with tsx), migrations, and the built SPA.
COPY server ./server
COPY db ./db
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
