FROM node:24-alpine AS base

WORKDIR /app

# ── dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY webapp/package.json webapp/yarn.lock ./
RUN yarn install --frozen-lockfile

# ── development ───────────────────────────────────────────────────────────────
FROM base AS development
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

COPY --from=deps /app/node_modules ./node_modules
COPY webapp/ .

EXPOSE 3000
CMD ["yarn", "dev", "--host", "0.0.0.0"]

# ── build ─────────────────────────────────────────────────────────────────────
FROM base AS build
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=deps /app/node_modules ./node_modules
COPY webapp/ .
RUN yarn build

# ── production ────────────────────────────────────────────────────────────────
FROM base AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]