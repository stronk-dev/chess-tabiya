FROM node:24.10.0-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends git netcat-openbsd stockfish \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@11.18.0 --activate

WORKDIR /workspace/chess-tabiya
