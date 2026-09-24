# syntax=docker/dockerfile:1.19@sha256:b6afd42430b15f2d2a4c5a02b919e98a525b785b1aaff16747d2f623364e39b6
# rfc/verifiable-runtime-distribution.md §2/§4 — the FOSS `server` image (`core` tier).
# Every FROM is the reviewed multi-platform index digest recorded in release/materials.v1.json
# (the tag is kept for readability only); every fetched input is checksum-locked; the final
# stage runs no package manager.

# ---------------------------------------------------------------------------------------------
# Stockfish 18: the pinned release binary (amd64) or pinned source build (arm64).
FROM docker.io/library/node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS stockfish

ARG TARGETARCH
ADD --checksum=sha256:5c6f38b02a4da5f3ffe763f27da6c3e743eebefd92b50cb3661623b96696adff \
    https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64.tar \
    /inputs/stockfish-ubuntu-x86-64.tar
ADD --checksum=sha256:b5d3b85e08cdf9189a4753142eb21a4333983d97501531b19e1cd1ac9fc43f35 \
    https://github.com/official-stockfish/Stockfish/archive/cb3d4ee9b47d0c5aae855b12379378ea1439675c.tar.gz \
    /inputs/stockfish-cb3d4ee9b47d0c5aae855b12379378ea1439675c.tar.gz
# The default NNUE nets the arm64 source build embeds (full SHA-256, not the 12-hex name prefix).
ADD --checksum=sha256:c288c895ea924429ea9092e3f36b2b3c1f00f2a3a4c759ff7e57e79e3b43e4a7 \
    https://tests.stockfishchess.org/api/nn/nn-c288c895ea92.nnue /inputs/nn-c288c895ea92.nnue
ADD --checksum=sha256:37f18f62d772f3107e1d6aaca3898c130c3c86f2ab63e6555fbbca20635a899d \
    https://tests.stockfishchess.org/api/nn/nn-37f18f62d772.nnue /inputs/nn-37f18f62d772.nnue
# arm64 compiles from source: exact compiler versions from the frozen Debian snapshot the base image
# records (release/materials.v1.json debianSnapshot); apt verifies each .deb against its signed index.
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      rm -f /etc/apt/sources.list.d/debian.sources \
      && printf '%s\n' \
        'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260918T000000Z bookworm main' \
        'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260918T000000Z bookworm-updates main' \
        'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260918T000000Z bookworm-security main' \
        > /etc/apt/sources.list \
      && apt-get -o Acquire::Retries=5 update \
      && apt-get install -y --no-install-recommends g++=4:12.2.0-3 make=4.3-4.1 \
      && rm -rf /var/lib/apt/lists/*; \
    fi
COPY tools/install-stockfish-linux.sh /usr/local/bin/install-stockfish-linux
RUN STOCKFISH_ARCHIVE_DIRECTORY=/inputs install-stockfish-linux /opt/stockfish

# ---------------------------------------------------------------------------------------------
# Build: pinned pnpm, lockfile-frozen install, bundled server and web artifacts.
FROM docker.io/library/node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS build

ADD --checksum=sha256:29c35ca8d2a287988fdee3e0f36e07d9b93783f567b579b7fd5b798a4563dd81 \
    https://registry.npmjs.org/pnpm/-/pnpm-11.18.0.tgz /opt/pnpm-11.18.0.tgz
RUN mkdir -p /opt/pnpm \
    && tar -xzf /opt/pnpm-11.18.0.tgz -C /opt/pnpm --strip-components=1 \
    && printf '%s\n' '#!/bin/sh' 'exec node /opt/pnpm/bin/pnpm.mjs "$@"' > /usr/local/bin/pnpm \
    && chmod 0755 /usr/local/bin/pnpm \
    && pnpm --version

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

# ---------------------------------------------------------------------------------------------
# Pre-image release inputs (§8 step 1): NOTICE.txt, licence texts, build-metadata.json and the
# allow-listed runtime-content bundle, generated from committed inputs by the same tool the release
# workflow runs outside the build. The prose roots below exist only to compile the runtime facts.
FROM build AS release-inputs

ARG TABIYA_VERSION=0.0.0-dev
ARG SOURCE_REVISION=0000000000000000000000000000000000000000
ARG TABIYA_REPOSITORY=https://github.com/stronk-dev/chess-tabiya
COPY LICENSE LICENSE
COPY release release
COPY tools/release tools/release
COPY tools/install-stockfish-linux.sh tools/install-stockfish-linux.sh
COPY planning/exploration/log.md planning/exploration/log.md
COPY docs docs
COPY rfc rfc
RUN node tools/release/pre-image.mjs --out /release \
      --version "$TABIYA_VERSION" --revision "$SOURCE_REVISION" --repository "$TABIYA_REPOSITORY"

# ---------------------------------------------------------------------------------------------
# Runtime (`core`): Node runtime, bundled server/web, Stockfish + source, allow-listed content,
# the Tabiya licence, NOTICE, licence texts and build metadata. No package manager, compiler,
# repository history, raw source, authoring tool, planning tree or arbitrary documentation.
FROM docker.io/library/node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6

ARG TABIYA_VERSION=0.0.0-dev
ARG SOURCE_REVISION=0000000000000000000000000000000000000000
ARG TABIYA_REPOSITORY=https://github.com/stronk-dev/chess-tabiya
# rfc/storage-backup-recovery.md §2: the immutable source revision every backup manifest and
# storage receipt records. Release builds pass the full commit SHA; local builds use dev+<sha>.
ARG TABIYA_APPLICATION_REVISION=dev+dirty

# The base image's JavaScript package managers are not runtime components.
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-v* \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && mkdir -p /data && chown node:node /data

COPY --from=stockfish /opt/stockfish/bin/stockfish /usr/games/stockfish
COPY --from=stockfish /opt/stockfish/source /usr/share/doc/stockfish/source

WORKDIR /app
COPY --from=build /app/apps/server/dist/main.js /app/apps/server/dist/longitudinal-worker-thread.js /app/apps/server/dist/longitudinal-worker-once.js /app/apps/server/dist/longitudinal-rebuild.js /app/apps/server/dist/storage-admin.js apps/server/dist/
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=release-inputs /release/app/ /app/
COPY --from=release-inputs /release/doc/ /usr/share/doc/chess-tabiya/

USER node

ENV DATABASE_PATH=/data/chess-tabiya.sqlite
ENV PORT=3000
ENV STATIC_DIRECTORY=/app/apps/web/dist
ENV STOCKFISH_PATH=/usr/games/stockfish
ENV TABIYA_RUNTIME_CONTENT_FACTS=/app/runtime-content/facts.json
ENV TABIYA_LEGAL_DIRECTORY=/usr/share/doc/chess-tabiya
ENV TABIYA_APPLICATION_REVISION=$TABIYA_APPLICATION_REVISION

LABEL org.opencontainers.image.title="chess-tabiya-server" \
      org.opencontainers.image.description="Tabiya chess phase rehearsal server (core tier)" \
      org.opencontainers.image.version="${TABIYA_VERSION}" \
      org.opencontainers.image.revision=$TABIYA_APPLICATION_REVISION \
      org.opencontainers.image.source="${TABIYA_REPOSITORY}" \
      org.opencontainers.image.url="${TABIYA_REPOSITORY}" \
      org.opencontainers.image.documentation="${TABIYA_REPOSITORY}/blob/${SOURCE_REVISION}/docs/release.md" \
      org.opencontainers.image.licenses="AGPL-3.0-only"

EXPOSE 3000
VOLUME ["/data"]
# Readiness, not liveness: storage prepared, current version, representative read, worker live.
# A pre-upgrade migration runs before HTTP opens, so the start period is generous.
# Readiness, not liveness: storage prepared, current version, representative read, worker live.
# A pre-upgrade migration runs before HTTP opens, so the start period is generous.
HEALTHCHECK --interval=10s --timeout=3s --start-period=120s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:3000/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# main.js owns the storage lock for its lifetime: replacement recovery, prepare-start (pre-upgrade
# snapshot + staged migration) and then HTTP. Maintenance: node apps/server/dist/storage-admin.js.
# A deployment profile is required (TABIYA_DEPLOYMENT_PROFILE); the Compose files set it.
CMD ["node", "apps/server/dist/main.js"]
