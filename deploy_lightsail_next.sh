#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=/opt/udn_studio
RELEASE="$APP_ROOT/releases/$(date +%Y%m%d%H%M%S)"
DATABASE_URL_VALUE="${DATABASE_URL:-file:/opt/udn_studio/data/dev.db}"
SITE_URL_VALUE="${NEXT_PUBLIC_SITE_URL:-https://studioundesignated.com}"
TOSS_CLIENT_KEY_VALUE="${NEXT_PUBLIC_TOSS_CLIENT_KEY:-}"
TOSS_SECRET_KEY_VALUE="${TOSS_SECRET_KEY:-}"

sudo mkdir -p "$APP_ROOT/releases" "$APP_ROOT/data"
sudo chown -R admin:admin "$APP_ROOT"

mkdir -p "$RELEASE"
tar -xzf /tmp/udn_next_deploy.tgz -C "$RELEASE"
cd "$RELEASE/web"

{
  printf 'DATABASE_URL=%s\n' "$DATABASE_URL_VALUE"
  printf 'NEXT_PUBLIC_SITE_URL=%s\n' "$SITE_URL_VALUE"
  printf 'NEXT_PUBLIC_TOSS_CLIENT_KEY=%s\n' "$TOSS_CLIENT_KEY_VALUE"
  printf 'TOSS_SECRET_KEY=%s\n' "$TOSS_SECRET_KEY_VALUE"
} > .env.production

npm ci
npm run db:generate
NEXT_PUBLIC_SITE_URL="$SITE_URL_VALUE" npm run build
DATABASE_URL="$DATABASE_URL_VALUE" npm run db:push

ln -sfn "$RELEASE" "$APP_ROOT/current"

sudo tee /etc/systemd/system/udn-next.service >/dev/null <<'SERVICEEOF'
[Unit]
Description=Studio UDN Next.js
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/opt/udn_studio/current/web
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
EnvironmentFile=/opt/udn_studio/current/web/.env.production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

sudo systemctl daemon-reload
sudo systemctl enable udn-next
sudo systemctl restart udn-next

if [ -f /tmp/https.conf ]; then
  sudo cp /etc/nginx/conf.d/https.conf "/etc/nginx/conf.d/https.conf.bak.$(date +%Y%m%d%H%M%S)" || true
  sudo cp /tmp/https.conf /etc/nginx/conf.d/https.conf
  sudo /usr/sbin/nginx -t
  sudo systemctl reload nginx
fi

sleep 3
systemctl is-active udn-next
curl -fsS http://127.0.0.1:3000 >/dev/null
