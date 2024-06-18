FROM node:22-alpine@sha256:df46071ae175bc2c0468ae58e32f00ed6c9779eb70112cdf0d2ccf85035bc7ff AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN  npm install --omit=dev

FROM node:22-alpine@sha256:df46071ae175bc2c0468ae58e32f00ed6c9779eb70112cdf0d2ccf85035bc7ff AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

FROM node:22-alpine@sha256:df46071ae175bc2c0468ae58e32f00ed6c9779eb70112cdf0d2ccf85035bc7ff AS runner
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
