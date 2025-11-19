#!/bin/bash

echo "=== PryceSync Mobile App Validation ==="
echo

# Check if mobile app directory exists
if [ -d "apps/mobile" ]; then
    echo "✅ Mobile app directory exists"
else
    echo "❌ Mobile app directory missing"
    exit 1
fi

# Check essential files
echo "Checking essential files..."
cd apps/mobile

files=(
    "package.json"
    "Dockerfile"
    "vite.config.ts"
    "tsconfig.json"
    "index.html"
    "src/main.ts"
    "src/App.vue"
    "src/router/index.ts"
    "src/views/HomeView.vue"
    "src/views/LoginView.vue"
    "src/views/DashboardView.vue"
    "src/styles/main.css"
    "src/styles/mobile-tokens.css"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo
echo "Checking Docker configuration..."

# Check if mobile-app service is in docker-compose.yml
if grep -q "mobile-app:" ../../docker-compose.yml; then
    echo "✅ mobile-app service configured in docker-compose.yml"
else
    echo "❌ mobile-app service not found in docker-compose.yml"
fi

# Check environment files
if [ -f ".env.development" ]; then
    echo "✅ .env.development exists"
else
    echo "❌ .env.development missing"
fi

echo
echo "=== Validation Complete ==="
echo
echo "To start the mobile app with Docker:"
echo "docker-compose up mobile-app"
echo
echo "Access the app at: http://localhost:5173"