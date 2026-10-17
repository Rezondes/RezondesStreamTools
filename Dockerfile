# 1. Build the dashboard and the overlays (the checks run before in CI: npm run verify)
FROM node:24-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src
RUN npx vite build

# 2. Build the server
FROM rust:1.98-alpine AS server
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY server-rs ./server-rs
RUN cargo build --release --locked --manifest-path server-rs/Cargo.toml -p rst-server

# 3. Slim runtime image: the server binary, the built pages and ffmpeg, no Node
FROM alpine:3.22
# ffmpeg builds stinger (WebM with alpha) and banners (GIF) from the frames the dashboard sends
RUN apk add --no-cache ffmpeg ca-certificates \
  && adduser -D -H rst \
  && mkdir /data /keys \
  && chown rst:rst /data /keys
ENV DIST=/app/dist DATA=/data PORT=8080
COPY --from=frontend /app/dist /app/dist
COPY --from=server /app/server-rs/target/release/rst /usr/local/bin/rst
USER rst
EXPOSE 8080
# /data: data database, encrypted files and backups; /keys: the key store and its copies (docker-compose.yml puts
# them in two named volumes, so a copy of the data never holds the keys)
VOLUME /data /keys
CMD ["rst", "serve"]
