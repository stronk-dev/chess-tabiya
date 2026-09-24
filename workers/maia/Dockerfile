# syntax=docker/dockerfile:1.19@sha256:b6afd42430b15f2d2a4c5a02b919e98a525b785b1aaff16747d2f623364e39b6
# rfc/verifiable-runtime-distribution.md §2/§4 — the FOSS `maia-cpu` image (`cpu` tier).
# Pinned CPython, the checksum-locked Maia3 source plus the recorded Tabiya patch, the exact weight
# bytes, a CPU-only dependency closure installed from hashed per-architecture locks, the sidecar
# and notices. No git, no live dependency ranges, no CUDA/NVIDIA component, no network at runtime.

# ---------------------------------------------------------------------------------------------
# Source: the pinned archive (no .git history) plus the repository patch, verified by digest.
FROM docker.io/library/python:3.12.13-slim-bookworm@sha256:4766d8b510c428e595d74b9cc5bbb2fae8e26316fffb4adc89908d79aacd58a2 AS source

ARG MAIA3_COMMIT=1e13597c42d4858b7cfd7cfdae01e297263364b2
ADD --checksum=sha256:774c363dd2f2d10d6996ef5ef0bdba473ae769a79e442132bd82d0e999b7b488 \
    https://github.com/CSSLab/maia3/archive/1e13597c42d4858b7cfd7cfdae01e297263364b2.tar.gz /inputs/maia3.tar.gz
COPY patches/maia3-uci-policy-mass.patch /inputs/maia3-uci-policy-mass.patch
# `patch` comes from the frozen Debian snapshot the base image records (release/materials.v1.json).
RUN rm -f /etc/apt/sources.list.d/debian.sources \
    && printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260803T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260803T000000Z bookworm-updates main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260803T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
    && apt-get -o Acquire::Retries=5 update \
    && apt-get install -y --no-install-recommends patch=2.7.6-7 \
    && rm -rf /var/lib/apt/lists/* \
    && echo "3aedf724d937bc3634406ad2ce1f7b62bc77e42b667bbee04cba021d56018ff6  /inputs/maia3-uci-policy-mass.patch" | sha256sum -c - \
    && mkdir -p /opt/maia3 \
    && tar -xzf /inputs/maia3.tar.gz -C /opt/maia3 --strip-components=1 \
    && patch -d /opt/maia3 -p1 --dry-run < /inputs/maia3-uci-policy-mass.patch \
    && patch -d /opt/maia3 -p1 < /inputs/maia3-uci-policy-mass.patch

# ---------------------------------------------------------------------------------------------
# Runtime (`cpu`).
FROM docker.io/library/python:3.12.13-slim-bookworm@sha256:4766d8b510c428e595d74b9cc5bbb2fae8e26316fffb4adc89908d79aacd58a2

ARG TARGETARCH
ARG MAIA3_COMMIT=1e13597c42d4858b7cfd7cfdae01e297263364b2
ARG MAIA3_MODEL_REVISION=b6559de2398d7140b985f28fd2c19fb5e47ddabe
ARG TABIYA_VERSION=0.0.0-dev
ARG SOURCE_REVISION=0000000000000000000000000000000000000000
ARG TABIYA_REPOSITORY=https://github.com/stronk-dev/chess-tabiya

COPY requirements-cpu-linux-amd64.txt requirements-cpu-linux-arm64.txt /opt/chess-tabiya/
COPY --from=source /opt/maia3 /opt/maia3
# Exact versions and artifact hashes only (`--require-hashes --no-deps`): a changed index cannot
# alter the installed closure. setuptools is installed first so the one sdist (chess) and Maia
# itself build without an unpinned build-isolation environment.
RUN grep -A1 '^setuptools==' "/opt/chess-tabiya/requirements-cpu-linux-${TARGETARCH}.txt" > /tmp/setuptools.txt \
    && python -m pip install --no-cache-dir --require-hashes --no-deps --only-binary=:all: -r /tmp/setuptools.txt \
    && python -m pip install --no-cache-dir --require-hashes --no-deps --only-binary=:all: --no-binary=chess --no-build-isolation \
      --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple \
      -r "/opt/chess-tabiya/requirements-cpu-linux-${TARGETARCH}.txt" \
    && python -m pip install --no-cache-dir --no-deps --no-build-isolation --no-index /opt/maia3 \
    && rm -rf /tmp/setuptools.txt /opt/maia3/build /root/.cache

# The exact Maia3-5M weight bytes, SHA-256 checked (not merely tested for pathname existence).
ADD --checksum=sha256:ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f \
    https://huggingface.co/UofTCSSLab/Maia3-5M/resolve/b6559de2398d7140b985f28fd2c19fb5e47ddabe/maia3-5m.pt \
    /opt/maia3-models/maia3-5m.pt

COPY sidecar.py /opt/chess-tabiya/maia-sidecar.py
COPY patches/maia3-uci-policy-mass.patch /opt/chess-tabiya/patches/maia3-uci-policy-mass.patch
COPY NOTICE.txt /usr/share/doc/chess-tabiya-maia/NOTICE.txt

# Final validation with networking disabled: CPU-only torch, no GPU distribution or library, the
# offline model handshake, and the weight digest.
RUN --network=none python -c "import torch, sys; sys.exit(0 if torch.version.cuda is None and not torch.backends.cuda.is_built() else 'torch is not the CPU-only build')" \
    && echo "ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f  /opt/maia3-models/maia3-5m.pt" | sha256sum -c - \
    && printf 'uci\nisready\nquit\n' | maia3-uci --model 5m --checkpoint-path /opt/maia3-models/maia3-5m.pt --use-uci-history | grep -qx readyok \
    && useradd --system --uid 10001 --home-dir /nonexistent --shell /usr/sbin/nologin maia

ENV HF_HUB_OFFLINE=1
ENV MAIA_READY_FILE=/tmp/ready
USER maia

LABEL org.opencontainers.image.title="chess-tabiya-maia-cpu" \
      org.opencontainers.image.description="Tabiya Maia3 human-move-model sidecar, CPU-only (cpu tier)" \
      org.opencontainers.image.version="${TABIYA_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_REVISION}" \
      org.opencontainers.image.source="${TABIYA_REPOSITORY}" \
      org.opencontainers.image.documentation="${TABIYA_REPOSITORY}/blob/${SOURCE_REVISION}/workers/maia/README.md" \
      org.opencontainers.image.licenses="AGPL-3.0-only" \
      org.chess-tabiya.maia3.commit="${MAIA3_COMMIT}" \
      org.chess-tabiya.maia3.model="maia3-5m@${MAIA3_MODEL_REVISION}"

# History conditioning is mandatory for every production request.
ENTRYPOINT ["maia3-uci", "--model", "5m", "--checkpoint-path", "/opt/maia3-models/maia3-5m.pt", "--use-uci-history"]
