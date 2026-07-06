# syntax=docker/dockerfile:1

# ── Build stage: compile the Vite/React static site ───────────────────────
FROM node:20-slim AS build
WORKDIR /app

# Optional: bake the registration endpoint at build time (Vite inlines VITE_*).
ARG VITE_REGISTRATION_ENDPOINT=""
ENV VITE_REGISTRATION_ENDPOINT=$VITE_REGISTRATION_ENDPOINT

# Install dependencies from the lockfile (reproducible).
COPY package.json package-lock.json ./
RUN npm ci

# Build the static bundle into /app/dist.
COPY . .
RUN npm run build

# ── Runtime stage: serve the static bundle with Nginx ─────────────────────
FROM nginx:alpine AS runtime

# Replace the default server with our SPA/static config.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built site.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
