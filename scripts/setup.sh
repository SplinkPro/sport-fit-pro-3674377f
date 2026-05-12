#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Pratibha by SPLINK — One-click local setup
# -----------------------------------------------------------------------------
# Usage: ./scripts/setup.sh
# -----------------------------------------------------------------------------
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}==>${NC} $*"; }
warn() { echo -e "${YELLOW}!! ${NC} $*"; }
fail() { echo -e "${RED}xx ${NC} $*"; exit 1; }

# 1. Toolchain check ---------------------------------------------------------
log "Checking toolchain"
command -v bun  >/dev/null || fail "bun is not installed. Install from https://bun.sh"
command -v node >/dev/null || warn "node not found — recommended Node 20+ for editor tooling"

NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)
if [ "$NODE_MAJOR" -lt 20 ]; then
  warn "Node $NODE_MAJOR detected — Node 20+ recommended"
fi

# 2. Environment file --------------------------------------------------------
if [ ! -f .env ]; then
  log "Creating .env from .env.example (please fill in real values)"
  cp .env.example .env
else
  log ".env already exists — leaving untouched"
fi

# 3. Install dependencies ----------------------------------------------------
log "Installing dependencies (bun install)"
bun install

# 4. Verify build ------------------------------------------------------------
log "Running unit tests"
bun run test

log "Running production build"
bun run build

# 5. Done --------------------------------------------------------------------
echo
log "Setup complete."
echo
echo "Next steps:"
echo "  1. Edit .env and fill in VITE_SUPABASE_* values"
echo "  2. Start dev server:  bun run dev"
echo "  3. Open:              http://localhost:8080"
echo
echo "Useful docs:"
echo "  - docs/HANDOVER.md       — production handover checklist"
echo "  - docs/DEPLOYMENT.md     — build & deploy guide"
echo "  - docs/TROUBLESHOOTING.md — common issues and fixes"
echo "  - docs/ARCHITECTURE.md   — system overview"
