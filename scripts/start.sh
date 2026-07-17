#!/bin/bash
# CloudVault Start Script
# Usage: ./start.sh [port]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Override port from command line
if [ -n "$1" ]; then
  export PORT="$1"
fi

# Set defaults
export PORT="${PORT:-3000}"
export STORAGE_DIR="${STORAGE_DIR:-./uploads}"
export DB_PATH="${DB_PATH:-./cloudvault.db}"

# Generate session secret if not set
if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" = "CHANGE_ME_TO_RANDOM_SECRET" ]; then
  if command -v openssl &>/dev/null; then
    SESSION_SECRET=$(openssl rand -hex 32)
    echo "Generated session secret. Save it to .env for persistence."
  else
    SESSION_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
    echo "Generated session secret (fallback). Save it to .env for persistence."
  fi
  export SESSION_SECRET
fi

echo "Starting CloudVault on http://localhost:$PORT"
exec node server.js
