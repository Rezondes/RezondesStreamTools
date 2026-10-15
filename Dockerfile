# 1. Overlays bauen
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: ffmpeg-static (nur für das Stinger-Rendern) braucht hier keinen Download
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# 2. Schlankes Laufzeit-Image: nur dist/ und der Server, keine node_modules
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production DIST=/app/dist DATA=/data CONFIG=/app/config PORT=8080
COPY --from=build /app/dist ./dist
COPY server ./server
# Der Server nutzt Kern-Module (IRC, Pfade, Einstellungen) und die Theme-Schemas der Overlays mit
COPY src ./src
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8080
CMD ["node", "server/index.ts"]
