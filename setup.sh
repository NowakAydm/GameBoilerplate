#!/bin/bash

# GameBoilerplate Setup Script
echo "🚀 Setting up GameBoilerplate Monorepo"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists."
fi

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Build shared package first (required by other packages)
echo "Building shared package..."
cd packages/shared
npm run build
cd ../..

# Install and build server
echo "Installing server dependencies..."
cd packages/server
npm install
echo "Building server..."
npm run build
cd ../..

# Install client dependencies
echo "Installing client dependencies..."
cd packages/client
npm install
cd ../..

# Install admin dependencies
echo "Installing admin dependencies..."
cd packages/admin
npm install
cd ../..

# Install test dependencies
echo "Installing test dependencies..."
cd tests
npm install
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit .env file with your configuration (MongoDB URI, JWT secret, etc.)"
echo "2. Start required services (MongoDB, etc.)"
echo "3. Start the server: cd packages/server && npm run dev"
echo "4. Start the client: cd packages/client && npm run dev"
echo "5. Start the admin (optional): cd packages/admin && npm run dev"
echo "6. Open http://localhost:5173 for client or http://localhost:5174 for admin"
echo ""
echo "📚 See README.md and phase-specific documentation for more details"
