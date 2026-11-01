FROM node:22.14.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate && npm run build
RUN mkdir -p /data && chown node:node /data
ENV DATABASE_URL=file:/data/interim.db
ENV PORT=5000
EXPOSE 5000
USER node
CMD ["npm", "run", "server"]
