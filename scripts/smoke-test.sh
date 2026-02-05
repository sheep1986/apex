#!/bin/bash

# Smoke tests for code quality and migration status
# Run: ./scripts/smoke-test.sh

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Running smoke tests...${NC}\n"

# Test 1: No deprecated Clerk props left
echo "1. Checking for deprecated Clerk props..."
if rg -n "afterSign(In|Up)Url" src 2>/dev/null; then
    echo -e "${RED}❌ Found deprecated Clerk props${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No deprecated Clerk props found${NC}"
fi

# Test 2: Ensure new props exist somewhere (sanity)
echo "2. Checking for new Clerk redirect props..."
if rg -n "fallbackRedirectUrl|forceRedirectUrl" src 2>/dev/null >/dev/null; then
    echo -e "${GREEN}✅ New redirect props found${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: No new redirect props found - check migration${NC}"
fi

# Test 3: Catch risky raw array ops in boundary layers
echo "3. Checking for unsafe array operations in boundary layers..."
UNSAFE_OPS=$(rg -n "(\.filter|\.reduce)\(" src/services src/api src/utils 2>/dev/null | rg -v "safeFilter|safeReduce" || true)
if [ -n "$UNSAFE_OPS" ]; then
    echo -e "${RED}❌ Found unsafe array operations:${NC}"
    echo "$UNSAFE_OPS"
    exit 1
else
    echo -e "${GREEN}✅ No unsafe array ops in boundary layers${NC}"
fi

# Test 4: Check for any .filter on response.data
echo "4. Checking for unsafe API response filtering..."
UNSAFE_API=$(rg -n "response\.data\.(filter|reduce|map)" src 2>/dev/null || true)
if [ -n "$UNSAFE_API" ]; then
    echo -e "${YELLOW}⚠️  Warning: Direct array operations on response.data:${NC}"
    echo "$UNSAFE_API"
    echo "Consider using asArray(response.data) instead"
else
    echo -e "${GREEN}✅ No unsafe API response operations${NC}"
fi

# Test 5: Ensure array utilities are imported where needed
echo "5. Checking array utility imports..."
ARRAY_UTILS_USED=$(rg -n "asArray|safeFilter|safeReduce" src --type ts --type tsx 2>/dev/null | wc -l || echo 0)
if [ "$ARRAY_UTILS_USED" -gt 0 ]; then
    echo -e "${GREEN}✅ Array utilities are being used ($ARRAY_UTILS_USED usages)${NC}"
else
    echo -e "${YELLOW}⚠️  No array utility usage found${NC}"
fi

echo -e "\n${GREEN}🎉 Smoke tests completed!${NC}"