FROM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_GITHUB_SERVER_URL
ARG NEXT_PUBLIC_GITHUB_API_URL
ARG NEXT_PUBLIC_GITHUB_GRAPHQL_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GITHUB_SERVER_URL=$NEXT_PUBLIC_GITHUB_SERVER_URL
ENV NEXT_PUBLIC_GITHUB_API_URL=$NEXT_PUBLIC_GITHUB_API_URL
ENV NEXT_PUBLIC_GITHUB_GRAPHQL_URL=$NEXT_PUBLIC_GITHUB_GRAPHQL_URL

RUN npm run build
RUN npm prune --omit=dev

FROM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS runner
LABEL maintainer="@github" \
    org.opencontainers.image.url="https://github.com/github-community-projects/private-mirrors" \
    org.opencontainers.image.source="https://github.com/github-community-projects/private-mirrors" \
    org.opencontainers.image.documentation="https://github.com/github-community-projects/private-mirrors" \
    org.opencontainers.image.vendor="GitHub Community Projects" \
    org.opencontainers.image.description="A GitHub App that allows you to contribute upstream using private mirrors of public projects."

RUN apk add --no-cache git
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"]
