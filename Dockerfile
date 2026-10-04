FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm install --omit=dev
COPY backend/src backend/src
RUN mkdir -p backend/data && chown -R node:node /app
USER node
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://localhost:3000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
CMD ["npm", "start"]

