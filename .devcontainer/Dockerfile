FROM node:24.10.0-bookworm AS stockfish

ARG TARGETARCH
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && if [ "$TARGETARCH" = "arm64" ]; then apt-get install -y --no-install-recommends g++ make; fi \
    && rm -rf /var/lib/apt/lists/*
COPY tools/install-stockfish-linux.sh /usr/local/bin/install-stockfish-linux
RUN install-stockfish-linux /opt/stockfish

FROM node:24.10.0-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends git netcat-openbsd \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@11.18.0 --activate

COPY --from=stockfish /opt/stockfish/bin/stockfish /usr/games/stockfish
COPY --from=stockfish /opt/stockfish/source /usr/share/doc/stockfish/source

WORKDIR /workspace/chess-tabiya
