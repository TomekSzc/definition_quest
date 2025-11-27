# Syntax: Use specific node version based on .nvmrc (22.14.0)
FROM node:22-alpine AS base
ENV NODE_ENV=production

# -----------------------------------------------------------------------------
# Deps Stage: Install dependencies
# -----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Install packages needed for build (python/make/g++ often needed for node-gyp)
# Check if we need these for current deps. If not, can skip to save time/space.
# RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --include=dev

# -----------------------------------------------------------------------------
# Build Stage: Build the application
# -----------------------------------------------------------------------------
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for variables required at build time (e.g. for static generation or client-side inlining)
ARG SUPABASE_URL
ARG SUPABASE_KEY

# Ensure these are available to the build process
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}

# Build the Astro application (output: server)
RUN npm run build

# -----------------------------------------------------------------------------
# Runner Stage: Create production image
# -----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

# Create non-root user
# Alpine 'node' user usually exists with uid 1000, but explicit creation ensures consistency
# We'll use the existing 'node' user
USER node

# Copy built assets
COPY --from=build --chown=node:node /app/dist ./dist
# Copy node_modules (production only)
# We need to prune dev dependencies or copy from a fresh install
# Re-installing prod-only deps is safer to ensure no dev deps leak
COPY package.json package-lock.json ./
# Running install as root before switching user, or ensuring permissions
USER root
RUN npm ci --omit=dev && npm cache clean --force
USER node

# Copy any other necessary files (e.g. public if not bundled, though Astro bundles assets)
# COPY --from=build --chown=node:node /app/public ./public 

# Environment configuration
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Start the application
CMD ["node", "./dist/server/entry.mjs"]

