# BACKEND
FROM node:18 AS backend
WORKDIR /app/server

# Install backend dependencies
COPY server/package.json server/package-lock.json ./
RUN npm install

# Copy backend source
COPY server .

# FRONTEND
FROM node:18 AS frontend
WORKDIR /app/client

# Install frontend dependencies
COPY client/package.json client/package-lock.json ./
RUN npm install

# Ensure Tailwind CSS, PostCSS, Autoprefixer are installed for build
RUN npm install -D tailwindcss postcss autoprefixer

# Copy frontend source
COPY client .

# Build frontend
RUN npm run build

# FINAL IMAGE
FROM node:18
WORKDIR /app

# Copy backend and frontend build output
COPY --from=backend /app/server ./server
COPY --from=frontend /app/client/dist ./client/dist

# Set environment and start server
ENV NODE_ENV=production
WORKDIR /app/server
CMD ["node", "index.js"]