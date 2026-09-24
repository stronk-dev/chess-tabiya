FROM node:24.21.0-bookworm-slim AS stockfish

ARG TARGETARCH
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && if [ "$TARGETARCH" = "arm64" ]; then apt-get install -y --no-install-recommends g++ make; fi \
    && rm -rf /var/lib/apt/lists/*
COPY tools/install-stockfish-linux.sh /usr/local/bin/install-stockfish-linux
RUN install-stockfish-linux /opt/stockfish

FROM node:24.21.0-bookworm-slim AS build

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

FROM node:24.21.0-bookworm-slim

# rfc/storage-backup-recovery.md §2: the immutable source revision every backup manifest and
# storage receipt records. Release builds pass the full commit SHA; local builds use dev+<sha>.
ARG TABIYA_APPLICATION_REVISION=dev+dirty
LABEL org.opencontainers.image.revision=$TABIYA_APPLICATION_REVISION

RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=stockfish /opt/stockfish/bin/stockfish /usr/games/stockfish
COPY --from=stockfish /opt/stockfish/source /usr/share/doc/stockfish/source

WORKDIR /app
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/server/artifacts apps/server/artifacts
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/schemas schemas
COPY --from=build /app/content content
COPY planning/exploration/log.md planning/exploration/log.md
COPY docs/tablebase-grounding.md docs/tablebase-grounding.md
COPY rfc/archive/graduation-clearance.md rfc/archive/graduation-clearance.md
COPY rfc/assistance-config-register.md rfc/assistance-config-register.md
COPY rfc/breadth-collectors.md rfc/breadth-collectors.md
COPY rfc/claim-semantic-anchors.md rfc/claim-semantic-anchors.md
COPY rfc/pack-training-forms.md rfc/pack-training-forms.md
COPY rfc/semantic-collectors.md rfc/semantic-collectors.md

RUN mkdir -p /data && chown node:node /data
USER node

ENV DATABASE_PATH=/data/chess-tabiya.sqlite
ENV PORT=3000
ENV STATIC_DIRECTORY=/app/apps/web/dist
ENV STOCKFISH_PATH=/usr/games/stockfish
ENV TABIYA_APPLICATION_REVISION=$TABIYA_APPLICATION_REVISION

EXPOSE 3000
VOLUME ["/data"]
# Readiness, not liveness: storage prepared, current version, representative read, worker live.
# A pre-upgrade migration runs before HTTP opens, so the start period is generous.
HEALTHCHECK --interval=10s --timeout=3s --start-period=120s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:3000/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# main.js owns the storage lock for its lifetime: replacement recovery, prepare-start (pre-upgrade
# snapshot + staged migration) and then HTTP. Maintenance: node apps/server/dist/storage-admin.js.
# A deployment profile is required (TABIYA_DEPLOYMENT_PROFILE); the Compose files set it.
CMD ["node", "apps/server/dist/main.js"]
