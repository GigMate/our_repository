#!/bin/bash

# GigMate Environment Setup Script
# This script helps you set up your .env file interactively

echo "🔐 GigMate Environment Setup"
echo "============================"
echo ""
echo "This script will help you create your .env file"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting."
        exit 0
    fi
fi

echo ""
echo "Let's set up your environment variables:"
echo ""

# Supabase URL
echo "1. Supabase URL (REQUIRED)"
echo "   Get from: https://supabase.com/dashboard → Your Project → Settings → API"
echo "   Example: https://abcdefgh12345678.supabase.co"
echo ""
read -p "Enter your Supabase URL: " SUPABASE_URL

# Supabase Anon Key
echo ""
echo "2. Supabase Anon Key (REQUIRED)"
echo "   Get from: https://supabase.com/dashboard → Your Project → Settings → API"
echo "   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY

# Optional: Stripe
echo ""
echo "3. Stripe Publishable Key (OPTIONAL - for payments)"
echo "   Get from: https://dashboard.stripe.com/apikeys"
echo "   Press Enter to skip"
echo ""
read -p "Enter your Stripe Publishable Key (or press Enter): " STRIPE_KEY

# Optional: Google Maps
echo ""
echo "4. Google Maps API Key (OPTIONAL - for location features)"
echo "   Get from: https://console.cloud.google.com/apis/credentials"
echo "   Press Enter to skip"
echo ""
read -p "Enter your Google Maps API Key (or press Enter): " MAPS_KEY

# Create .env file
cat > .env << EOF
# GigMate Environment Variables
# Generated on $(date)

# ===================================
# SUPABASE (REQUIRED)
# ===================================
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# For local Edge Function development
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

EOF

# Add optional variables if provided
if [ ! -z "$STRIPE_KEY" ]; then
    cat >> .env << EOF
# ===================================
# STRIPE (OPTIONAL - For Payments)
# ===================================
VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_KEY

EOF
fi

if [ ! -z "$MAPS_KEY" ]; then
    cat >> .env << EOF
# ===================================
# GOOGLE MAPS (OPTIONAL - For Maps)
# ===================================
VITE_GOOGLE_MAPS_API_KEY=$MAPS_KEY

EOF
fi

# Add placeholders for other optional services
cat >> .env << EOF
# ===================================
# EMAIL (OPTIONAL)
# ===================================
# RESEND_API_KEY=re_your_key_here

# ===================================
# MAYDAY (OPTIONAL - Background Checks)
# ===================================
# MAYDAY_API_KEY=your_mayday_key_here

# ===================================
# DEVELOPMENT
# ===================================
PORT=5173
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "📝 Summary:"
echo "  - Supabase URL: $SUPABASE_URL"
echo "  - Supabase Anon Key: ${SUPABASE_ANON_KEY:0:20}..."
if [ ! -z "$STRIPE_KEY" ]; then
    echo "  - Stripe Key: ${STRIPE_KEY:0:20}..."
fi
if [ ! -z "$MAPS_KEY" ]; then
    echo "  - Google Maps Key: ${MAPS_KEY:0:20}..."
fi
echo ""
echo "🚀 Next steps:"
echo "  1. Review your .env file"
echo "  2. Run: ./deploy.sh"
echo ""
