#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_PORT=3001
WEB_PORT=3000
MIN_NODE_MAJOR=22

check_node() {
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -lt "$MIN_NODE_MAJOR" ]; then
    echo "Node $MIN_NODE_MAJOR or newer is required, found $(node -v)." >&2
    exit 1
  fi
}

install_dependencies() {
  if [ ! -d "$ROOT/node_modules" ]; then
    echo "Installing dependencies..."
    npm install --prefix "$ROOT"
  fi
}

copy_env_files() {
  if [ ! -f "$ROOT/frontend/.env.local" ] && [ -f "$ROOT/.env" ]; then
    grep '^XAI_API_KEY=' "$ROOT/.env" > "$ROOT/frontend/.env.local"
    grep -v '^XAI_API_KEY=' "$ROOT/frontend/.env.example" >> "$ROOT/frontend/.env.local"
    echo "Wrote frontend/.env.local (xAI key and app defaults only)"
  fi
  if [ ! -f "$ROOT/backend/.env.local" ] && [ -f "$ROOT/.env" ]; then
    cp "$ROOT/.env" "$ROOT/backend/.env.local"
    echo "Copied .env to backend/.env.local"
  fi
}

stop_all() {
  echo "Stopping..."
  kill 0
}

start_apps() {
  trap stop_all INT TERM
  npm run dev --prefix "$ROOT" --workspace @grok-hack/api &
  npm run dev --prefix "$ROOT" --workspace @edubot/web &
  echo "API: http://localhost:$API_PORT  App: http://localhost:$WEB_PORT"
  wait
}

check_node
install_dependencies
copy_env_files
start_apps
