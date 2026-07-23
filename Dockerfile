# syntax=docker/dockerfile:1

# ── Build stage: install every dep and compile the Vite/React SPA ─────────
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vite inlines VITE_* at build time; the SPA calls the API on the same origin.
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
