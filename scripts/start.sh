#!/bin/sh
# Boot script for the Fly image (ADR-004). Applies pending migrations, then starts Next.
#
# A migration that failed once stays recorded as "failed" and makes `migrate deploy`
# exit with P3009 on every later boot, which took the site down (502). Here we mark
# that migration as rolled back and retry once, so the fixed migration is re-applied.
# If it still fails we start the server anyway and log loudly: a stale schema returns
# errors on some routes, but the site and the health check stay up. Never prints secrets.

migrate() { npx prisma migrate deploy 2>&1; }

out=$(migrate); status=$?
echo "$out"

if [ "$status" -ne 0 ]; then
  failed=$(echo "$out" | sed -n 's/.*The `\([^`]*\)` migration .*failed.*/\1/p' | head -n 1)
  if [ -n "$failed" ]; then
    echo "[boot] migration '$failed' is recorded as failed; marking it rolled back and retrying once"
    npx prisma migrate resolve --rolled-back "$failed" 2>&1
    out=$(migrate); status=$?
    echo "$out"
  fi
fi

if [ "$status" -ne 0 ]; then
  echo "[boot] WARNING: migrations did not apply (exit $status). Starting the server anyway; check 'fly logs' and fix the migration." >&2
fi

exec npx next start -H 0.0.0.0 -p 3000
