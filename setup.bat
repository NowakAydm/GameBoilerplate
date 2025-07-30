@echo off
echo 🚀 Setting up GameBoilerplate Monorepo
echo.

REM Check if .env exists
if not exist .env (
    echo 📋 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created. Please edit it with your configuration.
) else (
    echo ✅ .env file already exists.
)

echo.
echo 📦 Installing dependencies...

REM Install root dependencies
echo Installing root dependencies...
call npm install

REM Build shared package first (required by other packages)
echo Building shared package...
cd packages\shared
call npm run build
cd ..\..

REM Install and build server
echo Installing server dependencies...
cd packages\server
call npm install
echo Building server...
call npm run build
cd ..\..

REM Install client dependencies
echo Installing client dependencies...
cd packages\client
call npm install
cd ..\..

REM Install admin dependencies
echo Installing admin dependencies...
cd packages\admin
call npm install
cd ..\..

REM Install test dependencies
echo Installing test dependencies...
cd tests
call npm install
cd ..

echo.
echo 🎉 Setup complete!
echo.
echo 🔧 Next steps:
echo 1. Edit .env file with your configuration (MongoDB URI, JWT secret, etc.)
echo 2. Start required services (MongoDB, etc.)
echo 3. Start the server: cd packages\server ^&^& npm run dev
echo 4. Start the client: cd packages\client ^&^& npm run dev
echo 5. Start the admin (optional): cd packages\admin ^&^& npm run dev
echo 6. Open http://localhost:5173 for client or http://localhost:5174 for admin
echo.
echo 📚 See README.md and phase-specific documentation for more details
pause
