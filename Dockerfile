# Base image for backend
FROM node:18 AS backend

WORKDIR /app/server

COPY server/package.json ./

RUN npm install

COPY server .

RUN npm run build

# Base image for frontend
FROM node:18 AS frontend

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./

RUN npm install

COPY client .

RUN npm run build

# Final stage to serve frontend and backend (multi-service)
FROM node:18

WORKDIR /app

COPY --from=backend /app/server/dist ./server
COPY --from=backend /app/server/node_modules ./server/node_modules
COPY --from=frontend /app/client/dist ./client

# Start the server
CMD ["node", "server/index.js"]