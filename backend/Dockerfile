# ---- Stage 1: Build ----
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: Runtime ----
FROM node:20-slim
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y libssl3 ca-certificates curl && \
    curl -L https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.9.4.deb -o /tmp/mongodb-tools.deb && \
    dpkg -i /tmp/mongodb-tools.deb && \
    rm /tmp/mongodb-tools.deb && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
RUN useradd -m appuser
COPY --chown=appuser:appuser . .

# Tạo folder logs và cấp quyền cho appuser
RUN mkdir -p logs && chown -R appuser:appuser logs

USER appuser
EXPOSE 5000
CMD ["npm", "start"]
