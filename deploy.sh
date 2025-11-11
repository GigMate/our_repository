#!/bin/bash

# GigMate Automated Deployment Script
# This script automates the entire deployment process to Vercel

set -e  # Exit on any error

echo "🚀 GigMate Automated Deployment"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo ""
    echo "Please create a .env file with your Supabase credentials:"
    echo ""
    echo "VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=your-anon-key"
    echo ""
    echo "You can copy from .env.example:"
    echo "cp .env.example .env"
    echo ""
    exit 1
fi

# Load environment variables
source .env

# Verify required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo ""
    echo "Please set in .env file:"
    echo "VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=your-anon-key"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 3: Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
fi
echo ""

# Step 4: Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
echo ""
echo -e "${YELLOW}Note: You may need to login to Vercel on first run${NC}"
echo ""

# Deploy with environment variables
vercel --prod \
  -e VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  ${VITE_STRIPE_PUBLISHABLE_KEY:+-e VITE_STRIPE_PUBLISHABLE_KEY="$VITE_STRIPE_PUBLISHABLE_KEY"} \
  ${VITE_GOOGLE_MAPS_API_KEY:+-e VITE_GOOGLE_MAPS_API_KEY="$VITE_GOOGLE_MAPS_API_KEY"}

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your GigMate platform is now live!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update Supabase auth URLs with your Vercel URL"
    echo "2. Deploy Edge Functions: ./deploy-functions.sh"
    echo "3. Test your deployment"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
