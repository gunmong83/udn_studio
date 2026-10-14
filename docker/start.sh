#!/bin/sh
set -eu

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
export DATABASE_URL="${DATABASE_URL:-file:/data/dev.db}"

mkdir -p /data

cd /app
# This checkout tracks a SQLite schema without a migration history.
# `migrate deploy` succeeds with no migrations but does not add new tables.
if [ -d prisma/migrations ]; then
  npx prisma migrate deploy
else
  npx prisma db push --skip-generate
fi
exec npm run start -- -H "$HOSTNAME" -p "$PORT"
