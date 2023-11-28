# Dockerfile used to build an image for the ordzaar-api
FROM node:20.9.0-alpine3.18

RUN corepack enable pnpm
RUN pnpm config set auto-install-peers true

RUN apk --no-cache add curl git
RUN apk add --no-cache --virtual .gyp python3 make g++
# See: https://github.com/vercel/turbo/issues/2198#issuecomment-1276475618
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=false
ENV CYPRESS_INSTALL_BINARY=0

COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY .npmrc ./

COPY apps ./apps
COPY packages ./packages

EXPOSE 5742

RUN pnpm fetch

RUN pnpm install -r --offline
RUN pnpm build --filter="api"

CMD node apps/api/dist/main.js
