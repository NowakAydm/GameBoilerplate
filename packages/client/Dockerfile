# Use the latest Node.js LTS version
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY packages/client/package*.json ./packages/client/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/client ./packages/client
COPY packages/shared ./packages/shared

# Build the application
RUN npm run build --workspace=packages/client

# Expose port
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--workspace=packages/client"]
