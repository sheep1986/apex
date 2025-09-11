#!/bin/bash

# Check deployment status for Apex Platform
echo "🔍 Checking Apex Platform Deployment Status"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Frontend URL
FRONTEND_URL="https://apex-platform.netlify.app"
# Backend URL (update this with your Railway URL)
BACKEND_URL="https://apex-backend-august-production.up.railway.app"

echo ""
echo "📍 Frontend (Netlify):"
echo "   URL: $FRONTEND_URL"

# Check frontend
response=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$response" = "200" ]; then
    echo -e "   Status: ${GREEN}✓ Online${NC} (HTTP $response)"
else
    echo -e "   Status: ${RED}✗ Offline${NC} (HTTP $response)"
fi

echo ""
echo "📍 Backend (Railway):"
echo "   URL: $BACKEND_URL"

# Check backend health endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
if [ "$response" = "200" ]; then
    echo -e "   Status: ${GREEN}✓ Online${NC} (HTTP $response)"
else
    echo -e "   Status: ${YELLOW}⚠ Check Required${NC} (HTTP $response)"
    echo "   Note: Backend may be sleeping or need configuration"
fi

echo ""
echo "📍 API Connectivity:"
# Test API proxy through Netlify
api_response=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/api/health)
if [ "$api_response" = "200" ]; then
    echo -e "   Netlify → Railway: ${GREEN}✓ Connected${NC}"
else
    echo -e "   Netlify → Railway: ${RED}✗ Not Connected${NC} (HTTP $api_response)"
    echo "   Check netlify.toml redirects configuration"
fi

echo ""
echo "==========================================="
echo "📋 Next Steps:"
echo "1. If backend is offline, check Railway logs"
echo "2. Configure environment variables on both platforms"
echo "3. Test user authentication flow"
echo "4. Verify database connectivity"