# Prototype build template. Use the repository root as the build context.
FROM node:22-bookworm-slim AS build
WORKDIR /source
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci --ignore-scripts --no-audit --no-fund && npm run build:cloud

FROM node:22-bookworm-slim
WORKDIR /app
COPY packages/cloud-documents/package.json ./package.json
COPY LICENSE NOTICE ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund && mkdir /data && chown node:node /data
COPY --from=build /source/packages/cloud-documents/dist ./dist
USER node
ENV GENOFFICE_CLOUD_DATA_DIR=/data
ENV GENOFFICE_CLOUD_HOST=0.0.0.0
ENV GENOFFICE_CLOUD_PORT=5182
EXPOSE 5182
VOLUME ["/data"]
CMD ["node", "dist/server.mjs"]
