FROM python:3.12.13-slim-bookworm

ARG MAIA3_COMMIT=1e13597c42d4858b7cfd7cfdae01e297263364b2
ARG MAIA3_MODEL_REVISION=b6559de2398d7140b985f28fd2c19fb5e47ddabe

RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

COPY patches/maia3-uci-policy-mass.patch /tmp/maia3-uci-policy-mass.patch
COPY sidecar.py /opt/chess-tabiya/maia-sidecar.py

RUN git clone https://github.com/CSSLab/maia3.git /opt/maia3 \
    && git -C /opt/maia3 checkout "${MAIA3_COMMIT}" \
    && test "$(git -C /opt/maia3 rev-parse HEAD)" = "${MAIA3_COMMIT}" \
    && git -C /opt/maia3 apply --check /tmp/maia3-uci-policy-mass.patch \
    && git -C /opt/maia3 apply /tmp/maia3-uci-policy-mass.patch

# D655 — the default `cpu` tier: CPU-only PyTorch from the official CPU index, so no CUDA/cuDNN/NCCL
# or proprietary NVIDIA distribution enters the image (D615). An `accelerated` image is a separate,
# separately labelled artifact; this Dockerfile never builds one.
ARG TORCH_CPU_INDEX=https://download.pytorch.org/whl/cpu
RUN python -m pip install --no-cache-dir --index-url "${TORCH_CPU_INDEX}" torch==2.8.0+cpu \
    && python -m pip install --no-cache-dir python-chess==1.999 /opt/maia3 \
    && python -m pip list --format=freeze > /tmp/installed.txt \
    && if grep -Eiq '^(nvidia|triton|cuda)' /tmp/installed.txt; then echo "GPU distribution in the CPU tier" >&2 && exit 1; fi \
    && python -c "import torch; assert not torch.cuda.is_available() and torch.version.cuda is None, torch.version.cuda"

# Pre-bake and verify the exact 5M checkpoint observed during first contact.
RUN maia3-cache --model maia3-5m \
    && test -f "/root/.cache/huggingface/hub/models--UofTCSSLab--Maia3-5M/snapshots/${MAIA3_MODEL_REVISION}/maia3-5m.pt"

ENV HF_HUB_OFFLINE=1

LABEL org.opencontainers.image.source="https://github.com/CSSLab/maia3" \
      org.chess-tabiya.maia3.commit="${MAIA3_COMMIT}" \
      org.chess-tabiya.maia3.model="maia3-5m@${MAIA3_MODEL_REVISION}" \
      org.chess-tabiya.resource-tier="cpu"

# History conditioning is mandatory for every production request.
ENTRYPOINT ["maia3-uci", "--model", "5m", "--use-uci-history"]
