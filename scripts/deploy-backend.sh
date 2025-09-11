#!/bin/bash

# Deploy Backend to Railway
echo "🚀 Deploying Backend to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
    echo "Please run 'railway login' first, then run this script again."
    exit 1
fi

# Navigate to backend directory
cd apps/backend

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Backend package.json not found.${NC}"
    exit 1
fi

# Check if logged in to Railway
railway whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Railway. Please login:${NC}"
    railway login
fi

# Build the backend
echo "📦 Building backend..."
npm install
npm run build

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Build had warnings/errors but continuing...${NC}"
fi

# Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    echo "Check deployment at: https://railway.app/dashboard"
    
    # Get deployment URL
    echo "Getting deployment URL..."
    railway status
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

cd ../..
echo -e "${GREEN}Deployment complete!${NC}"