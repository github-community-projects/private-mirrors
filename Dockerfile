FROM node:23-alpine@sha256:b20f8fad528b0e768936cb88ccb7b0e37cf41587d177e2d6fcdbd48bb4e083ec AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN  npm install --omit=dev

FROM node:23-alpine@sha256:b20f8fad528b0e768936cb88ccb7b0e37cf41587d177e2d6fcdbd48bb4e083ec AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

FROM node:23-alpine@sha256:b20f8fad528b0e768936cb88ccb7b0e37cf41587d177e2d6fcdbd48bb4e083ec AS runner
RUN apk add --no-cache git
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
