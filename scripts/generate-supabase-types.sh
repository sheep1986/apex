#!/bin/bash

# Generate TypeScript types from Supabase schema
# Run this script to keep your types in sync with the database

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Generating Supabase types...${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

# Get project ID from environment or prompt
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "Enter your Supabase project ID (from project settings):"
    read -r PROJECT_ID
else
    PROJECT_ID=$SUPABASE_PROJECT_ID
fi

# Generate types
echo -e "${YELLOW}📝 Fetching schema from Supabase...${NC}"
npx supabase gen types typescript \
  --project-id "$PROJECT_ID" \
  --schema public \
  > src/types/supabase.ts

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Types generated successfully!${NC}"
    echo -e "${GREEN}📁 Output: src/types/supabase.ts${NC}"
    
    # Add type exports to index
    cat > src/types/database.ts << 'EOF'
/**
 * Database types generated from Supabase schema
 * Generated on: $(date)
 */

export * from './supabase';

// Helper types for common patterns
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? U : never;
export type DbResultErr<T> = T extends PromiseLike<{ error: infer U }> ? U : never;

// Enum type helpers
export type CountryCode = 'GB' | 'US' | 'CA' | 'AU' | 'NZ' | 'IE';
export type PhoneStatus = 'active' | 'inactive' | 'suspended';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
EOF
    
    echo -e "${GREEN}✅ Helper types created!${NC}"
else
    echo -e "${RED}❌ Failed to generate types. Check your project ID and connection.${NC}"
    exit 1
fi

echo -e "${YELLOW}💡 Tip: Add this to package.json scripts:${NC}"
echo '  "db:types": "./scripts/generate-supabase-types.sh"'