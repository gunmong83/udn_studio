#!/bin/sh
set -eu

: "${EPOST_POLLING_TOKEN:?EPOST_POLLING_TOKEN is required}"

exec /usr/bin/curl \
  --fail-with-body \
  --silent \
  --show-error \
  --max-time 1200 \
  --request POST \
  --header "Authorization: Bearer ${EPOST_POLLING_TOKEN}" \
  --header "Accept: application/json" \
  http://127.0.0.1:3001/api/cron/epost-tracking
