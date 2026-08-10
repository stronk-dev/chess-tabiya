# Maia sidecar smoke container (Q5). Python exists ONLY inside this container
# (scoped exception, owner ruling 2026-08-12); research instrument, not product.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends stockfish git \
    && rm -rf /var/lib/apt/lists/*

# Maia-3 installs from source (no PyPI package): https://github.com/CSSLab/maia3
RUN git clone --depth 1 https://github.com/CSSLab/maia3.git /opt/maia3 \
    && pip install --no-cache-dir python-chess /opt/maia3

# Pre-bake the 5M checkpoint so runs never download (maia3 caches from HF).
RUN maia3-cache --model maia3-5m

WORKDIR /harness
COPY runner.py analyze.py positions.json ./

ENV SF_CMD=stockfish
# --use-uci-history = move-history conditioning: the coherence knob. On by default.
ENV MAIA_CMD="maia3-uci --model 5m --use-uci-history"
CMD ["python", "runner.py"]
