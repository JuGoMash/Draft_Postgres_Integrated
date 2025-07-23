# Use an official Node.js image as the base
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY server/package.json server/package-lock.json ./
RUN npm install

# Copy the entire server directory
COPY server .

# Compile TypeScript to JavaScript
RUN npx tsc

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
