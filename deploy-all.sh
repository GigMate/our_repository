#!/bin/bash

# GigMate Complete Deployment Automation
# This single script does EVERYTHING for you

set -e

echo ""
echo "🎉 GigMate Complete Automated Deployment"
echo "========================================="
echo ""
echo "This script will:"
echo "  1. Set up your environment (if needed)"
echo "  2. Install dependencies"
echo "  3. Build the project"
echo "  4. Deploy to Vercel"
echo "  5. Deploy Edge Functions"
echo "  6. Verify deployment"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print step headers
print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Step 1: Check/Create .env file
print_step "Step 1/6: Environment Setup"

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo ""
    read -p "Would you like to create it interactively? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        chmod +x setup-env.sh
        ./setup-env.sh
    else
        echo -e "${RED}❌ Cannot proceed without .env file${NC}"
        echo ""
        echo "Please create .env file with:"
        echo "  VITE_SUPABASE_URL=https://your-project.supabase.co"
        echo "  VITE_SUPABASE_ANON_KEY=your-anon-key"
        echo ""
        echo "Or run: ./setup-env.sh"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Load environment variables
source .env

# Verify required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Missing required environment variables${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"

# Step 2: Install dependencies
print_step "Step 2/6: Installing Dependencies"

echo -e "${BLUE}📦 Running npm install...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Build project
print_step "Step 3/6: Building Project"

echo -e "${BLUE}🔨 Running build...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 4: Install Vercel CLI (if needed)
print_step "Step 4/6: Vercel Setup"

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installing Vercel CLI...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI ready${NC}"
fi

# Step 5: Deploy to Vercel
print_step "Step 5/6: Deploying to Vercel"

echo -e "${BLUE}🚀 Deploying...${NC}"
echo ""
echo -e "${YELLOW}Note: You may need to login to Vercel on first run${NC}"
echo ""

# Deploy
vercel --prod \
  -e VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  ${VITE_STRIPE_PUBLISHABLE_KEY:+-e VITE_STRIPE_PUBLISHABLE_KEY="$VITE_STRIPE_PUBLISHABLE_KEY"} \
  ${VITE_GOOGLE_MAPS_API_KEY:+-e VITE_GOOGLE_MAPS_API_KEY="$VITE_GOOGLE_MAPS_API_KEY"}

VERCEL_EXIT=$?

if [ $VERCEL_EXIT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Vercel deployment successful${NC}"
else
    echo ""
    echo -e "${RED}❌ Vercel deployment failed${NC}"
    exit 1
fi

# Step 6: Deploy Edge Functions
print_step "Step 6/6: Deploying Edge Functions"

echo -e "${BLUE}🔧 Deploying Supabase Edge Functions...${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
    echo ""
    read -p "Install Supabase CLI and deploy functions? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g supabase
        chmod +x deploy-functions.sh
        ./deploy-functions.sh
    else
        echo -e "${YELLOW}⚠️  Skipping Edge Functions deployment${NC}"
        echo "You can deploy them later with: ./deploy-functions.sh"
    fi
else
    chmod +x deploy-functions.sh
    ./deploy-functions.sh
fi

# Final summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Your GigMate platform is now live!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Get your Vercel URL from the output above"
echo ""
echo "2. Update Supabase Auth URLs:"
echo "   - Go to: https://supabase.com/dashboard"
echo "   - Navigate to: Authentication → URL Configuration"
echo "   - Set Site URL: https://your-vercel-url.app"
echo "   - Add Redirect URL: https://your-vercel-url.app/**"
echo ""
echo "3. Test your deployment:"
echo "   - Visit your Vercel URL"
echo "   - Try signing up"
echo "   - Test features"
echo ""
echo "4. Optional - Configure Stripe webhook:"
echo "   - Go to: https://dashboard.stripe.com/webhooks"
echo "   - Add endpoint: https://YOUR-PROJECT.supabase.co/functions/v1/stripe-webhook"
echo "   - Select events: checkout.session.completed, etc."
echo ""
echo -e "${GREEN}📚 Documentation:${NC}"
echo "  - VERCEL_READY.md"
echo "  - DEPLOY_NOW_CHECKLIST.md"
echo "  - VERCEL_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${GREEN}🎸 Your $100M platform is live! Good luck! 🚀${NC}"
echo ""
