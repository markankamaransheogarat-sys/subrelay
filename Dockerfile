FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=client-builder /app/client/dist ./client/dist
ENV NODE_ENV=production PORT=4001
EXPOSE 4001
USER node
CMD ["node", "server/index.js"]
