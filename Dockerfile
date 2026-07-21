FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.next/standalone ./

COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/.next/server ./.next/server

COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=5010

EXPOSE 5010

CMD ["node", "server.js"]
