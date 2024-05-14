ARG BUILDKIT_SBOM_SCAN_CONTEXT=true

FROM node:20.13.1-alpine AS installer
ARG BUILDKIT_SBOM_SCAN_STAGE=true

WORKDIR /app

COPY . .

RUN npm ci

WORKDIR /app/packages/connect-button

RUN NODE_OPTIONS=--max_old_space_size=4096 npm run build:storybook

FROM nginx:alpine AS storybook
ARG BUILDKIT_SBOM_SCAN_STAGE=true

WORKDIR /app

COPY --from=installer /app/packages/connect-button/storybook-static /usr/share/nginx/html
COPY --from=installer /app/packages/connect-button/nginx/mime.types /etc/nginx/mime.types
COPY --from=installer /app/packages/connect-button/nginx/default.conf /etc/nginx/conf.d/default.conf
