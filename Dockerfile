# Base image for backend
FROM node:18 AS backend

WORKDIR /app/server
COPY server/package.json ./
RUN npm install
COPY server/. .

# Base image for frontend
FROM node:18 AS frontend

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/. .
RUN npm run build

# Final image to serve frontend and backend
FROM node:18

WORKDIR /app

# Copy server files
COPY --from=backend /app/server ./server

# Copy built frontend
COPY --from=frontend /app/client/dist ./client/dist

# Install backend dependencies again in case needed at runtime
WORKDIR /app/server
RUN npm install --omit=dev

# Expose backend port
EXPOSE 3000

# Run backend server
CMD ["node", "index.js"]