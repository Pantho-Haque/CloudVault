#!/bin/bash
# CloudVault Installer
# Supports: Termux (Android), Linux, macOS
# Usage: curl -sSL <repo-url>/scripts/install.sh | bash

set -e

INSTALL_DIR="$HOME/cloudvault"
REPO_URL="${CLOUDVAULT_REPO:-https://github.com/Pantho-Haque/CloudVault.git}"
MIN_NODE_MAJOR=24

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Detect environment
detect_environment() {
  if [ -n "$PREFIX" ] && echo "$PREFIX" | grep -q "com.termux"; then
    ENV="termux"
  elif [ "$(uname)" = "Darwin" ]; then
    ENV="macos"
  elif [ -f /etc/debian_version ] || [ -f /etc/redhat-release ]; then
    ENV="linux"
  else
    ENV="unknown"
  fi
  info "Detected environment: $ENV"
}

# Check and install Node.js
check_node() {
  if command -v node &>/dev/null; then
    local node_version
    node_version=$(node --version | sed 's/v//')
    local major
    major=$(echo "$node_version" | cut -d. -f1)
    if [ "$major" -ge "$MIN_NODE_MAJOR" ]; then
      success "Node.js v${node_version} found"
      return 0
    else
      warn "Node.js v${node_version} is too old (need >= $MIN_NODE_MAJOR)"
    fi
  fi

  info "Installing Node.js..."
  case "$ENV" in
    termux)
      pkg update -y
      pkg install -y nodejs
      ;;
    macos)
      if command -v brew &>/dev/null; then
        brew install node
      else
        error "Homebrew not found. Install it from https://brew.sh or install Node.js manually."
      fi
      ;;
    linux)
      if command -v apt-get &>/dev/null; then
        sudo apt-get update
        sudo apt-get install -y nodejs npm
      elif command -v dnf &>/dev/null; then
        sudo dnf install -y nodejs npm
      else
        error "Please install Node.js $MIN_NODE_MAJOR+ manually from https://nodejs.org"
      fi
      ;;
    *)
      error "Please install Node.js $MIN_NODE_MAJOR+ manually from https://nodejs.org"
      ;;
  esac

  # Verify installation
  if ! command -v node &>/dev/null; then
    error "Node.js installation failed"
  fi
  success "Node.js installed: $(node --version)"
}

# Check and install pnpm
check_pnpm() {
  if command -v pnpm &>/dev/null; then
    success "pnpm found"
    return 0
  fi

  info "Installing pnpm..."
  npm install -g pnpm
  success "pnpm installed"
}

# Check and install git
check_git() {
  if command -v git &>/dev/null; then
    success "Git found"
    return 0
  fi

  info "Installing git..."
  case "$ENV" in
    termux)
      pkg install -y git
      ;;
    macos)
      xcode-select --install 2>/dev/null || true
      ;;
    linux)
      sudo apt-get install -y git 2>/dev/null || sudo dnf install -y git 2>/dev/null || true
      ;;
  esac

  if ! command -v git &>/dev/null; then
    error "Git installation failed"
  fi
  success "Git installed"
}

# Clone or update repo
setup_repo() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull --ff-only || warn "Could not pull latest changes"
  else
    info "Cloning CloudVault..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi
  success "Repository ready at $INSTALL_DIR"
}

# Install dependencies and build
build() {
  info "Installing dependencies..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install

  info "Building for production..."
  pnpm run build
  success "Build complete"
}

# Generate .env file
setup_env() {
  if [ -f .env ]; then
    info ".env already exists, skipping"
    return
  fi

  info "Generating .env configuration..."
  local session_secret
  if command -v openssl &>/dev/null; then
    session_secret=$(openssl rand -hex 32)
  else
    session_secret=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  fi

  cat > .env << EOF
SESSION_SECRET=$session_secret
PORT=3000
STORAGE_DIR=./uploads
DB_PATH=./cloudvault.db
MAX_UPLOAD_SIZE_MB=100
TRASH_RETENTION_DAYS=30
MAX_FILE_VERSIONS=5
EOF

  chmod 600 .env
  success ".env created"
}

# Create global command
create_command() {
  local bin_dir

  if [ "$ENV" = "termux" ]; then
    bin_dir="$PREFIX/bin"
  elif [ -d /usr/local/bin ] && [ -w /usr/local/bin ]; then
    bin_dir="/usr/local/bin"
  else
    bin_dir="$HOME/.local/bin"
    mkdir -p "$bin_dir"
    if ! echo "$PATH" | grep -q "$bin_dir"; then
      warn "$bin_dir is not in your PATH. Add this to your shell profile:"
      warn "  export PATH=\"$bin_dir:\$PATH\""
    fi
  fi

  cat > "$bin_dir/cloudvault" << SCRIPT
#!/bin/bash
cd "$INSTALL_DIR"

# Load .env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

export PORT="\${PORT:-3000}"
export STORAGE_DIR="\${STORAGE_DIR:-./uploads}"
export DB_PATH="\${DB_PATH:-./cloudvault.db}"

if [ -z "\$SESSION_SECRET" ] || [ "\$SESSION_SECRET" = "CHANGE_ME_TO_RANDOM_SECRET" ]; then
  if command -v openssl &>/dev/null; then
    export SESSION_SECRET=\$(openssl rand -hex 32)
  else
    export SESSION_SECRET=\$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \\n')
  fi
fi

echo "CloudVault running at http://localhost:\$PORT"
exec node server.js
SCRIPT

  chmod +x "$bin_dir/cloudvault"
  success "Created 'cloudvault' command at $bin_dir/cloudvault"
}

# Print summary
print_summary() {
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}   CloudVault installed successfully!   ${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo "  Start:  cloudvault"
  echo "  URL:    http://localhost:3000"
  echo "  Dir:    $INSTALL_DIR"
  echo ""
  echo "  First run will prompt you to create an admin account."
  echo ""
}

# Main
main() {
  echo -e "${BLUE}CloudVault Installer${NC}"
  echo ""
  detect_environment
  check_git
  check_node
  check_pnpm
  setup_repo
  build
  setup_env
  create_command
  print_summary
}

main "$@"
