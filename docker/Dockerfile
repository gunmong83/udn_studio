# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Vite 프로젝트 폴더명
ARG APP_SUBDIR=web

# 패키지 파일만 먼저 (캐시)
COPY ${APP_SUBDIR}/package.json ${APP_SUBDIR}/package-lock.json ./
RUN npm ci

# 소스 복사
COPY ${APP_SUBDIR}/ ./

# 빌드
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ${APP_SUBDIR}/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
