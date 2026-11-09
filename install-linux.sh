#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [[ "$(uname -m)" != x86_64 ]]; then
  echo 'This release supports Linux amd64. ARM64 has not been validated.' >&2
  exit 1
fi
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  echo 'Install Docker Engine and Compose v2 first, using the official instructions:' >&2
  echo 'https://docs.docker.com/engine/install/ubuntu/' >&2
  exit 1
fi
docker info >/dev/null
if [[ "$(docker info --format '{{.OSType}}')" != linux ]]; then
  echo 'A Linux Docker engine is required.' >&2
  exit 1
fi
if ! mkdir .install.lock 2>/dev/null; then
  echo 'Another installer may be running. See docs for a stale .install.lock.' >&2
  exit 1
fi
trap 'rmdir .install.lock' EXIT
umask 077
if [[ ! -e .env ]]; then
  env_tmp=$(mktemp .env.new.XXXXXX)
  for key in ONEBOT_TOKEN WEBUI_TOKEN SETUP_TOKEN CONSOLE_TOKEN; do
    value=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
    printf '%s=%s\n' "$key" "$value" >> "$env_tmp"
  done
  mv -- "$env_tmp" .env
fi
chmod 600 .env
for key in ONEBOT_TOKEN WEBUI_TOKEN SETUP_TOKEN CONSOLE_TOKEN; do
  if ! grep -Eq "^${key}=[a-f0-9]{64}$" .env; then
    echo 'Invalid .env. Restore the private backup; do not regenerate credentials for existing data.' >&2
    exit 1
  fi
done
docker compose config --quiet
docker compose up -d --build
echo 'Waiting for setup; first run can take up to 15 minutes...'
for ((attempt=0; attempt<180; attempt++)); do
  if docker compose exec -T agent node -e "fetch('http://127.0.0.1:8080/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    token=$(sed -n 's/^SETUP_TOKEN=//p' .env)
    printf '\nOpen an SSH tunnel from your own computer, then visit this private URL:\nhttp://127.0.0.1:18670/?token=%s\n' "$token"
    echo 'Tunnel example (replace user and host):'
    echo 'ssh -N -L 127.0.0.1:18670:127.0.0.1:18670 -L 127.0.0.1:18699:127.0.0.1:18699 -L 127.0.0.1:18680:127.0.0.1:18680 -L 127.0.0.1:18610:127.0.0.1:18610 user@host'
    exit 0
  fi
  sleep 5
done
echo 'Setup timeout. Run docker compose logs --tail 80 agent. Existing data is preserved.' >&2
exit 1
