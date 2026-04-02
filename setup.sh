#!/bin/bash

# ============================================================================
# Setup Script for Les Bâtisseurs Engagés - Local Development Environment
# ============================================================================
# This script configures the local development environment after downloading
# the project ZIP file from GitHub.
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "============================================================================"
echo "  Les Bâtisseurs Engagés - Setup Local Environment"
echo "============================================================================"
echo ""

# Function to print colored output
print_step() {
    echo -e "${BLUE}[$(printf '%1s' $1)/6]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check Node.js
print_step "1" "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
print_success "Node.js is installed: $(node --version)"
echo ""

# Step 2: Check package manager
print_step "2" "Checking package manager..."
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    print_success "Using pnpm: $(pnpm --version)"
else
    PKG_MANAGER="npm"
    print_success "Using npm: $(npm --version)"
fi
echo ""

# Step 3: Install dependencies
print_step "3" "Installing dependencies..."
echo "Running: $PKG_MANAGER install"
if $PKG_MANAGER install; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies!"
    exit 1
fi
echo ""

# Step 4: Setup environment file
print_step "4" "Checking environment configuration..."
if [ -f ".env.local" ]; then
    print_warning ".env.local already exists"
else
    print_step "4" "Creating .env.local file..."
    cat > .env.local << 'EOF'
# Les Bâtisseurs Engagés - Local Environment Configuration
# ============================================================

# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/batisseurs_db

# Authentication
JWT_SECRET=your-secret-key-here-change-in-production

# OAuth Configuration (from Manus)
VITE_APP_ID=your-app-id-from-manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key-from-manus
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key-from-manus

# Owner Information
OWNER_NAME=Your Organization Name
OWNER_OPEN_ID=your-open-id

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# Application Settings
VITE_APP_TITLE=Les Bâtisseurs Engagés
VITE_APP_LOGO=https://your-logo-url.png
EOF
    print_success ".env.local created successfully!"
    echo ""
    print_warning "IMPORTANT: Please update the following values in .env.local:"
    echo "   - DATABASE_URL: Your local database connection string"
    echo "   - JWT_SECRET: A strong random secret"
    echo "   - VITE_APP_ID: Your Manus app ID"
    echo "   - API Keys and tokens from Manus"
    echo ""
fi
echo ""

# Step 5: Database setup
print_step "5" "Database setup..."
echo "To set up your database:"
echo "   1. Install MySQL or use a local database service"
echo "   2. Create a database named 'batisseurs_db'"
echo "   3. Update DATABASE_URL in .env.local with your connection string"
echo "   4. Run: $PKG_MANAGER run db:migrate"
echo ""

# Step 6: Display next steps
print_step "6" "Setup complete!"
echo ""
echo "============================================================================"
echo "  Next Steps:"
echo "============================================================================"
echo ""
echo "1. Update .env.local with your configuration:"
echo "   - Database connection string"
echo "   - Manus API credentials"
echo "   - Other environment variables"
echo ""
echo "2. Set up your database:"
echo "   - Create a MySQL database"
echo "   - Run migrations: $PKG_MANAGER run db:migrate"
echo ""
echo "3. Start the development server:"
echo "   $PKG_MANAGER run dev"
echo ""
echo "4. Open in browser:"
echo "   http://localhost:5173"
echo ""
echo "============================================================================"
echo ""
echo "For more information, see README.md"
echo ""
