#!/bin/sh
set -eu

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
export DATABASE_URL="${DATABASE_URL:-file:/data/dev.db}"

mkdir -p /data

cd /app
npx prisma migrate deploy || npx prisma db push
npm run start -- -H "$HOSTNAME" -p "$PORT" &

nginx -g "daemon off;"
