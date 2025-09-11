#!/bin/bash

# Deploy both Frontend and Backend
echo "🚀 Full Deployment: Frontend (Netlify) + Backend (Railway)"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1/2: Deploying Backend to Railway${NC}"
echo "----------------------------------------"
./scripts/deploy-backend.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Backend deployment failed. Stopping.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2/2: Deploying Frontend to Netlify${NC}"
echo "----------------------------------------"
./scripts/deploy-frontend.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend deployment failed.${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Full deployment complete!${NC}"
echo ""
echo "📍 Frontend: https://apex-platform.netlify.app"
echo "📍 Backend: Check Railway dashboard for URL"
echo ""
echo "Next steps:"
echo "1. Verify frontend loads correctly"
echo "2. Test API connectivity"
echo "3. Check Railway logs for any errors"
echo "4. Test lead import functionality"