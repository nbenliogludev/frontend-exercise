FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock lerna.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN yarn install --frozen-lockfile

FROM deps AS build

ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .

RUN yarn build

FROM node:20-bookworm-slim AS server

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/server/data/users.sqlite

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/data/.gitkeep ./server/data/.gitkeep

EXPOSE 3001

CMD ["node", "server/dist/index.js"]

FROM node:20-bookworm-slim AS client

WORKDIR /app/client

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ../node_modules
COPY --from=build /app/client/package.json ./package.json
COPY --from=build /app/client/dist ./dist

EXPOSE 5173

CMD ["node", "../node_modules/vite/bin/vite.js", "preview", "--host", "0.0.0.0", "--port", "5173"]
