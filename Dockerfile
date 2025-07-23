# --------- Build frontend ---------
FROM node:18 AS frontend
WORKDIR /app
COPY client ./client
WORKDIR /app/client
RUN npm install
RUN npm run build

# --------- Build backend ----------
FROM node:18 AS backend
WORKDIR /app
COPY server ./server
COPY package*.json ./
COPY --from=frontend /app/client/dist ./client-dist
RUN npm install
COPY . .

# Optional: Run seed script
# RUN npx tsx seed.ts

EXPOSE 3000
CMD ["node", "server/index.js"]