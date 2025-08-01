#!/bin/bash
# Node.js Version Setup Script

echo "🚀 Setting up Node.js 22 for GameBoilerplate"

# Check if nvm is installed
if command -v nvm &> /dev/null; then
    echo "✅ NVM is installed"
    
    # Install and use Node.js 22
    echo "📦 Installing Node.js 22..."
    nvm install 22
    nvm use 22
    
    # Set Node.js 22 as default
    nvm alias default 22
    
    echo "✅ Node.js version:"
    node --version
    
    echo "✅ NPM version:"
    npm --version
    
else
    echo "❌ NVM not found. Please install NVM first:"
    echo "   Windows: https://github.com/coreybutler/nvm-windows"
    echo "   macOS/Linux: https://github.com/nvm-sh/nvm"
    exit 1
fi

echo ""
echo "🔧 Installing dependencies..."
npm install

echo ""
echo "🎯 Next steps:"
echo "   1. Run 'npm run dev' to start development servers"
echo "   2. Run 'npm test' to run tests"
echo "   3. Run 'npm run build' to build all packages"
echo ""
echo "🎉 Setup complete! You're ready to develop with Node.js 22"
