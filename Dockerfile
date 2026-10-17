# 1. Build the overlays
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# 2. Slim runtime image: only dist/ and the server, no node_modules
FROM node:24-alpine
WORKDIR /app
# ffmpeg builds stinger (WebM with alpha) and banners (GIF) from the frames the dashboard sends
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production DIST=/app/dist DATA=/data PORT=8080
COPY --from=build /app/dist ./dist
COPY server ./server
# The server shares core modules (IRC, paths, settings) and the theme schemas with the overlays
COPY src ./src
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8080
CMD ["node", "server/index.ts"]
