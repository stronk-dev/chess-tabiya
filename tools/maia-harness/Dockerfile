# E4 Maia coherence harness — disposable research container (Q5/E4).
# Python exists ONLY inside this container (scoped exception, owner ruling
# 2026-08-12); it is a research instrument, not product code.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends stockfish \
    && rm -rf /var/lib/apt/lists/*

# maia3 per https://github.com/CSSLab/maia3 — pin the version at first real run
# and record it in run-meta. If the package's UCI entrypoint differs from
# `maia3`, set MAIA_CMD accordingly (see README).
RUN pip install --no-cache-dir python-chess maia3

WORKDIR /harness
COPY runner.py analyze.py positions.json ./

ENV SF_CMD=stockfish
CMD ["python", "runner.py"]
