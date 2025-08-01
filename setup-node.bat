@echo off
REM Node.js Version Setup Script for Windows

echo 🚀 Setting up Node.js 22 for GameBoilerplate

REM Check if nvm is installed
where nvm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ NVM not found. Please install NVM for Windows first:
    echo    https://github.com/coreybutler/nvm-windows
    pause
    exit /b 1
)

echo ✅ NVM is installed

REM Install and use Node.js 22
echo 📦 Installing Node.js 22...
nvm install 22.0.0
nvm use 22.0.0

echo ✅ Node.js version:
node --version

echo ✅ NPM version:
npm --version

echo.
echo 🔧 Installing dependencies...
npm install

echo.
echo 🎯 Next steps:
echo    1. Run 'npm run dev' to start development servers
echo    2. Run 'npm test' to run tests
echo    3. Run 'npm run build' to build all packages
echo.
echo 🎉 Setup complete! You're ready to develop with Node.js 22

pause
