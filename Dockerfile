# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────────────────────
# PathologyManager UI — multi-stage build (Angular 20 → static → nginx)
#
#   Stage 1 (build): npm ci + ng build (production, optimized).
#   Stage 2 (final): serve the static bundle via nginx with SPA fallback and a
#                    reverse proxy for /api to the API container.
#
# NOTE: this app bakes the API URL at build time (environment.apiBaseUrl). To use
# the same-origin nginx proxy below, set the production apiBaseUrl to "/api";
# otherwise the browser calls whatever absolute URL is compiled in. See README.
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build the Angular app ────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies against the lockfile first (better layer caching).
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle.
#   builder    = @angular/build:application
#   outputPath = dist/pathology-manager-web  (browser assets flattened here)
COPY . ./
RUN npm run build -- --configuration=production

# ── Stage 2: serve via nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS final

# SPA + reverse-proxy config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static bundle from the build stage.
COPY --from=build /app/dist/pathology-manager-web /usr/share/nginx/html

EXPOSE 80
