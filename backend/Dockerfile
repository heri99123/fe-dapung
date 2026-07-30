# ---------- Base ----------
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---------- Dependencies (prod only) ----------
FROM base AS deps
RUN npm ci --omit=dev

# ---------- Dependencies (dev, termasuk devDependencies) ----------
FROM base AS deps-dev
RUN npm ci

# ---------- Development ----------
FROM deps-dev AS development
ENV NODE_ENV=development
ENV PORT=5006
WORKDIR /app
COPY . .
EXPOSE 5006
CMD ["npm", "run", "dev"]

# ---------- Production ----------
FROM base AS production
ENV NODE_ENV=production
ENV PORT=5006
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5006
CMD ["npm", "start"]