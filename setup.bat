@echo off
REM ============================================================================
REM Setup Script for Les Bâtisseurs Engagés - Local Development Environment
REM ============================================================================
REM This script configures the local development environment after downloading
REM the project ZIP file from GitHub.
REM ============================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================================
echo  Les Bâtisseurs Engagés - Setup Local Environment
echo ============================================================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo Node.js is installed: 
node --version
echo.

REM Check if npm or pnpm is available
echo [2/6] Checking package manager...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo Using npm as package manager
    set PKG_MANAGER=npm
) else (
    echo Using pnpm as package manager
    set PKG_MANAGER=pnpm
)
echo.

REM Install dependencies
echo [3/6] Installing dependencies...
echo Running: %PKG_MANAGER% install
call %PKG_MANAGER% install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo.
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

REM Create .env.local file if it doesn't exist
echo [4/6] Checking environment configuration...
if exist ".env.local" (
    echo .env.local already exists
) else (
    echo Creating .env.local file...
    (
        echo # Les Bâtisseurs Engagés - Local Environment Configuration
        echo # ============================================================
        echo.
        echo # Database Configuration
        echo DATABASE_URL=mysql://user:password@localhost:3306/batisseurs_db
        echo.
        echo # Authentication
        echo JWT_SECRET=your-secret-key-here-change-in-production
        echo.
        echo # OAuth Configuration (from Manus)
        echo VITE_APP_ID=your-app-id-from-manus
        echo OAUTH_SERVER_URL=https://api.manus.im
        echo VITE_OAUTH_PORTAL_URL=https://portal.manus.im
        echo.
        echo # Manus APIs
        echo BUILT_IN_FORGE_API_URL=https://api.manus.im
        echo BUILT_IN_FORGE_API_KEY=your-api-key-from-manus
        echo VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
        echo VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key-from-manus
        echo.
        echo # Owner Information
        echo OWNER_NAME=Your Organization Name
        echo OWNER_OPEN_ID=your-open-id
        echo.
        echo # Analytics (optional^)
        echo VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
        echo VITE_ANALYTICS_WEBSITE_ID=your-website-id
        echo.
        echo # Application Settings
        echo VITE_APP_TITLE=Les Bâtisseurs Engagés
        echo VITE_APP_LOGO=https://your-logo-url.png
    ) > .env.local
    echo .env.local created successfully!
    echo.
    echo IMPORTANT: Please update the following values in .env.local:
    echo   - DATABASE_URL: Your local database connection string
    echo   - JWT_SECRET: A strong random secret
    echo   - VITE_APP_ID: Your Manus app ID
    echo   - API Keys and tokens from Manus
    echo.
)
echo.

REM Create database if needed
echo [5/6] Database setup...
echo To set up your database:
echo   1. Install MySQL or use a local database service
echo   2. Create a database named "batisseurs_db"
echo   3. Update DATABASE_URL in .env.local with your connection string
echo   4. Run: %PKG_MANAGER% run db:migrate
echo.

REM Display next steps
echo [6/6] Setup complete!
echo.
echo ============================================================================
echo  Next Steps:
echo ============================================================================
echo.
echo 1. Update .env.local with your configuration:
echo    - Database connection string
echo    - Manus API credentials
echo    - Other environment variables
echo.
echo 2. Set up your database:
echo    - Create a MySQL database
echo    - Run migrations: %PKG_MANAGER% run db:migrate
echo.
echo 3. Start the development server:
echo    %PKG_MANAGER% run dev
echo.
echo 4. Open in browser:
echo    http://localhost:5173
echo.
echo ============================================================================
echo.
echo For more information, see README.md
echo.
pause
