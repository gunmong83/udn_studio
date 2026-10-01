#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=/opt/udn_studio
RELEASE="$APP_ROOT/releases/$(date +%Y%m%d%H%M%S)"
SITE_URL_VALUE="${NEXT_PUBLIC_SITE_URL:-https://studioundesignated.com}"

sudo mkdir -p "$APP_ROOT/releases"
sudo chown -R admin:admin "$APP_ROOT"

mkdir -p "$RELEASE"
tar -xzf /tmp/udn_next_deploy.tgz -C "$RELEASE"
cd "$RELEASE/web"

printf 'NEXT_PUBLIC_SITE_URL=%s\n' "$SITE_URL_VALUE" > .env.production

npm ci
NEXT_PUBLIC_SITE_URL="$SITE_URL_VALUE" npm run build

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
