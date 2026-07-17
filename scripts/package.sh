#!/bin/bash
set -e

echo "Building CloudVault for distribution..."

# Clean previous build
rm -rf dist/cloudvault

# Run production build
pnpm run build

# Create output directory
mkdir -p dist/cloudvault

# Copy standalone output
cp -r build/standalone/* dist/cloudvault/

# Copy static assets
mkdir -p dist/cloudvault/build/static
cp -r build/static/* dist/cloudvault/build/static/ 2>/dev/null || true

# Copy public assets
mkdir -p dist/cloudvault/public
cp -r public/* dist/cloudvault/public/ 2>/dev/null || true

# Create empty uploads directory
mkdir -p dist/cloudvault/uploads

# Copy start scripts
cp scripts/start.sh dist/cloudvault/
cp scripts/start.bat dist/cloudvault/ 2>/dev/null || true

# Create default .env if it doesn't exist
cat > dist/cloudvault/.env.example << 'EOF'
SESSION_SECRET=CHANGE_ME_TO_RANDOM_SECRET
PORT=3000
STORAGE_DIR=./uploads
DB_PATH=./cloudvault.db
MAX_UPLOAD_SIZE_MB=100
TRASH_RETENTION_DAYS=30
MAX_FILE_VERSIONS=5
EOF

# Copy install script
cp scripts/install.sh dist/cloudvault/ 2>/dev/null || true

# Create tarball
cd dist
tar -czf cloudvault.tar.gz cloudvault/
cd ..

echo "Build complete! Output: dist/cloudvault.tar.gz"
