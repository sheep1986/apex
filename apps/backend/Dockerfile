# Use official Node.js runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Pin pnpm via Corepack
ARG PNPM_VERSION=10.13.1
RUN npm install -g corepack@0.24.1 && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy manifests first (from repo root paths!)
COPY apps/backend/package.json apps/backend/pnpm-lock.yaml ./

# Then install with frozen lockfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --frozen-lockfile

# Then copy the rest of the backend source
COPY apps/backend/. .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]