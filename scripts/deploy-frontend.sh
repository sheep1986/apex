#!/bin/bash

# Deploy Frontend to Netlify
echo "🚀 Deploying Frontend to Netlify..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

# Build the project
echo "📦 Building frontend..."
npm install
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Please fix errors and try again.${NC}"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist directory not found after build.${NC}"
    exit 1
fi

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --dir=dist --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo "Visit your site at: https://apex-platform.netlify.app"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi