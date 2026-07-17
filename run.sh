#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "CloudVault — local dev setup"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node.js 24+ from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 24 ]; then
  echo "ERROR: Node.js $(node --version) is too old. Need v24+ for node:sqlite."
  exit 1
fi

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

# Generate SESSION_SECRET if .env is missing or incomplete
if [ ! -f .env ] || ! grep -q "SESSION_SECRET=" .env 2>/dev/null; then
  echo "Generating .env with SESSION_SECRET..."
  if command -v openssl &>/dev/null; then
    SECRET=$(openssl rand -hex 32)
  else
    SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  fi
  cat > .env << EOF
SESSION_SECRET=$SECRET
PORT=3000
STORAGE_DIR=./uploads
DB_PATH=./cloudvault.db
MAX_UPLOAD_SIZE_MB=100
EOF
  echo ".env created"
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Start dev server
echo ""
echo "Starting CloudVault dev server..."
pnpm run dev
