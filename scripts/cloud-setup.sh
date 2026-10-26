#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
# A writable local toolchain works even when the image defaults to Node 24.
if [[ -x "$PWD/.cloud-tools/node_modules/.bin/node" ]]; then
  export PATH="$PWD/.cloud-tools/node_modules/.bin:$PATH"
fi
if [[ "$(node -p 'process.versions.node.split(".")[0]')" != "22" ]]; then
  npm install --prefix .cloud-tools --cache .npm-cache --no-save --package-lock=false node@22
  export PATH="$PWD/.cloud-tools/node_modules/.bin:$PATH"
fi
node --version
npm --version
if [[ -f package-lock.json ]]; then
  npm ci --include=dev
else
  npm install --include=dev
fi
npm run build
# Sourcing preserves Node 22 in subsequent commands in this shell.
