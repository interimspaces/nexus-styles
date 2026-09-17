#!/usr/bin/env bash
# Copy the shared Governance theme into the two apps that vendor it.
# Usage: bash scripts/sync-governance-theme.sh [nexus root]
set -euo pipefail
ROOT="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
SRC="$(cd "$(dirname "$0")/.." && pwd)/governance.css"
for target in \
  "$ROOT/nexus-dashboard/app/integrations/governance/governance-theme.css" \
  "$ROOT/quorum-app/vendor/nexus-styles/governance.css"; do
  if [[ -d "$(dirname "$target")" ]]; then
    cp "$SRC" "$target"
    echo "synced $target"
  else
    echo "skip (missing dir) $target" >&2
  fi
done
shasum -a 256 "$SRC"
