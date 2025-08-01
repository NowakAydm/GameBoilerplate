# Use the latest Node.js LTS version
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY packages/admin/package*.json ./packages/admin/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/admin ./packages/admin
COPY packages/shared ./packages/shared

# Build the application
RUN npm run build --workspace=packages/admin

# Expose port
EXPOSE 5174

# Start the development server
CMD ["npm", "run", "dev", "--workspace=packages/admin"]
