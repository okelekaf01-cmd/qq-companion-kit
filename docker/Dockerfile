FROM node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g @deepseek-ai/dsh@0.2.1-rc.2 pnpm@11.25.0
RUN node /usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-subprocess-local/scripts/ensure-spawn-helper.mjs
ARG BRIDGE_REV=a49877f4e58d04e47532d44b803360d0f001160d
RUN mkdir -p /opt/qq-bridge && curl -fsSL "https://codeload.github.com/Derpyu520/qq-bridge/tar.gz/${BRIDGE_REV}" | tar -xz --strip-components=1 -C /opt/qq-bridge
WORKDIR /opt/qq-bridge
RUN npm ci --omit=dev
COPY docker/ /opt/kit/
COPY docs/ /opt/kit/docs/
RUN node /opt/kit/prepare-bridge.mjs /opt/qq-bridge && node scripts/build-agent-preset-patches.mjs
USER node
ENV HOME=/data DSH_HOME=/data/dsh NODE_OPTIONS=--max-old-space-size=512
WORKDIR /data
CMD ["node","/opt/kit/runtime.mjs"]
