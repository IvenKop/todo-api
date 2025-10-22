FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY server/package.json server/package-lock.json ./
RUN npm ci

FROM deps AS build
COPY server/tsconfig.json ./tsconfig.json
COPY server/src ./src
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server/package.json ./
EXPOSE 4000
CMD ["npm", "run", "start"]
