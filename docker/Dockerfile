FROM node:20-alpine AS build
WORKDIR /app

ARG APP_SUBDIR=web
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY

COPY ${APP_SUBDIR}/package.json ${APP_SUBDIR}/package-lock.json ./
# The lockfile predates the Prisma/Auth adapter dependencies. Install from the
# manifest so CI can build the image while the lockfile is regenerated locally.
RUN npm install --legacy-peer-deps

COPY ${APP_SUBDIR}/ ./

ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders only. Production values are supplied at runtime.
ENV DATABASE_URL=file:/tmp/udn-build.db
ENV AUTH_SECRET=build-only-placeholder
ENV AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_TOSS_CLIENT_KEY=${NEXT_PUBLIC_TOSS_CLIENT_KEY}
RUN npm run db:generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

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
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000
CMD ["/start.sh"]
