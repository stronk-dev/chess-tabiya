FROM node:24.10.0-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/runtime/package.json packages/runtime/package.json
COPY packages/schema/package.json packages/schema/package.json
RUN pnpm install --frozen-lockfile

COPY apps apps
COPY packages packages
COPY schemas schemas
COPY content content
RUN pnpm build

FROM node:24.10.0-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-openbsd stockfish \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/schemas schemas
COPY --from=build /app/content content

RUN mkdir -p /data && chown node:node /data
USER node

ENV DATABASE_PATH=/data/chess-tabiya.sqlite
ENV PORT=3000
ENV STATIC_DIRECTORY=/app/apps/web/dist
ENV STOCKFISH_PATH=/usr/games/stockfish

EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "apps/server/dist/main.js"]
