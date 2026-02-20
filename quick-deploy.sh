#!/bin/bash

# Dookie Dynasty Dashboard - Quick Deploy Script
# Run this script to deploy via multiple methods

echo "🏆 DOOKIE DYNASTY DASHBOARD - QUICK DEPLOY"
echo "=========================================="
echo ""

# Check if build exists
if [ ! -d "build" ]; then
    echo "⚠️  No build folder found. Creating production build..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo "✅ Production build ready ($(du -sh build | cut -f1))"
echo ""

# Show deployment options
echo "🚀 DEPLOYMENT OPTIONS:"
echo "1. Surge (npm install -g surge && cd build && surge)"
echo "2. Vercel Web (upload to https://vercel.com/new)"
echo "3. Netlify Drag & Drop (https://netlify.com)"
echo ""

# Quick surge deployment option
read -p "Deploy with Surge now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v surge &> /dev/null; then
        echo "📦 Installing Surge..."
        npm install -g surge
    fi
    
    echo "🚀 Deploying to Surge..."
    cd build
    surge
    echo ""
    echo "✅ DEPLOYMENT COMPLETE!"
    echo "📱 Share your live URL with your dynasty league!"
else
    echo ""
    echo "🎯 Manual deployment options:"
    echo "• Vercel: https://vercel.com/new"
    echo "• Netlify: https://netlify.com (drag build folder)"
    echo "• Archive ready: dookie-dynasty-live-deployment.tar.gz"
    echo ""
    echo "⚡ Your dashboard is ready to go live!"
fi