#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$ROOT_DIR/packages/server"
OUT_DIR="${WAYPOINT_RELEASE_OUT_DIR:-$ROOT_DIR/.release}"
ASSET_NAME="${WAYPOINT_RELEASE_ASSET:-waypoint-cli.tar.gz}"
ASSET_PATH="$OUT_DIR/$ASSET_NAME"

info() {
  printf '\033[1;36m%s\033[0m %s\n' "waypoint" "$1"
}

if ! command -v pnpm >/dev/null 2>&1; then
  printf 'waypoint: pnpm is required to package the release\n' >&2
  exit 1
fi

info "installing package dependencies"
pnpm --dir "$ROOT_DIR" install --frozen-lockfile

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

package_dir="$tmp_dir/package"
info "deploying the production @logbookfordevs/waypoint package"
pnpm --dir "$ROOT_DIR" --filter @logbookfordevs/waypoint deploy --prod --legacy "$package_dir"
chmod +x "$package_dir/bin/cli.js"

mkdir -p "$OUT_DIR"
tar -czf "$ASSET_PATH" -C "$package_dir" .

if [[ "$(uname -s)" = "Darwin" ]]; then
  checksum="$(shasum -a 256 "$ASSET_PATH" | awk '{print $1}')"
else
  checksum="$(sha256sum "$ASSET_PATH" | awk '{print $1}')"
fi

printf '%s  %s\n' "$checksum" "$ASSET_NAME" > "$ASSET_PATH.sha256"
info "created $ASSET_PATH"
info "created $ASSET_PATH.sha256"
