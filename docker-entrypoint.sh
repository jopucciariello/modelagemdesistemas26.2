#!/bin/sh
# ADR-003/ADR-004: in production the app pulls its secrets from Infisical at boot.
# Fly only stores the machine identity (INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET).
set -eu

: "${INFISICAL_CLIENT_ID:?missing INFISICAL_CLIENT_ID (fly secrets)}"
: "${INFISICAL_CLIENT_SECRET:?missing INFISICAL_CLIENT_SECRET (fly secrets)}"
: "${INFISICAL_PROJECT_ID:?missing INFISICAL_PROJECT_ID (fly.toml [env])}"
INFISICAL_ENV="${INFISICAL_ENV:-prod}"

INFISICAL_TOKEN="$(infisical login --method=universal-auth \
  --client-id="$INFISICAL_CLIENT_ID" --client-secret="$INFISICAL_CLIENT_SECRET" \
  --silent --plain)"
export INFISICAL_TOKEN
unset INFISICAL_CLIENT_SECRET

exec infisical run --projectId="$INFISICAL_PROJECT_ID" --env="$INFISICAL_ENV" --path=/ --silent -- \
  sh -c 'npx prisma migrate deploy && exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"'
