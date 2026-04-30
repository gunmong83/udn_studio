FROM node:20-alpine AS build
WORKDIR /app

ARG APP_SUBDIR=web

COPY ${APP_SUBDIR}/package.json ${APP_SUBDIR}/package-lock.json ./
RUN npm ci

COPY ${APP_SUBDIR}/ ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run db:generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache nginx

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:/data/dev.db

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/start.sh /start.sh

RUN chmod +x /start.sh

EXPOSE 80 443
CMD ["/start.sh"]
