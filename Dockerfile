FROM node:24-alpine@sha256:37712740dc486f179b9540be1c6703cef3f805ea932573a007db748b71189afe AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN  npm install --omit=dev

FROM node:24-alpine@sha256:37712740dc486f179b9540be1c6703cef3f805ea932573a007db748b71189afe AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:24-alpine@sha256:37712740dc486f179b9540be1c6703cef3f805ea932573a007db748b71189afe AS runner
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
