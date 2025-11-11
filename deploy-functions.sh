#!/bin/bash

# GigMate Automated Edge Functions Deployment
# This script deploys all Supabase Edge Functions automatically

set -e

echo "🔧 GigMate Edge Functions Deployment"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "npm install -g supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if we're in a Supabase project
if [ ! -d "supabase/functions" ]; then
    echo -e "${RED}❌ Error: supabase/functions directory not found${NC}"
    echo "Make sure you're in the project root directory"
    exit 1
fi

# Count functions
FUNCTION_COUNT=$(find supabase/functions -maxdepth 1 -type d ! -path supabase/functions | wc -l)
echo -e "${BLUE}Found ${FUNCTION_COUNT} Edge Functions to deploy${NC}"
echo ""

# Deploy each function
SUCCESS_COUNT=0
FAIL_COUNT=0

for dir in supabase/functions/*/; do
    if [ -d "$dir" ]; then
        FUNCTION_NAME=$(basename "$dir")
        echo -e "${BLUE}📤 Deploying: ${FUNCTION_NAME}${NC}"

        if supabase functions deploy "$FUNCTION_NAME" --no-verify-jwt; then
            echo -e "${GREEN}✅ ${FUNCTION_NAME} deployed successfully${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e "${RED}❌ ${FUNCTION_NAME} deployment failed${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
        echo ""
    fi
done

# Summary
echo "======================================"
echo -e "${GREEN}Deployment Summary:${NC}"
echo -e "${GREEN}✅ Successful: ${SUCCESS_COUNT}${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Failed: ${FAIL_COUNT}${NC}"
fi
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All Edge Functions deployed successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some functions failed to deploy${NC}"
    exit 1
fi
