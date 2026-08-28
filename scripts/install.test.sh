#!/usr/bin/env bash
set -euo pipefail

if [[ "$(basename "$0")" = "curl" ]]; then
  output_path=""
  write_format=""
  url=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -o)
        output_path="$2"
        shift 2
        ;;
      -w)
        write_format="$2"
        shift 2
        ;;
      -*)
        shift
        ;;
      *)
        url="$1"
        shift
        ;;
    esac
  done

  printf '%s\n' "$url" >> "$FAKE_CURL_LOG"

  case "$url" in
    https://github.com/logbookfordevs/logbook-waypoint/releases/latest)
      [[ "$output_path" = "/dev/null" ]]
      [[ "$write_format" = "%{url_effective}" ]]
      printf 'https://github.com/logbookfordevs/logbook-waypoint/releases/tag/v0.1.1'
      ;;
    https://github.com/logbookfordevs/logbook-waypoint/releases/download/v0.1.1/waypoint-cli.tar.gz)
      cp "$FAKE_ARCHIVE" "$output_path"
      ;;
    https://github.com/logbookfordevs/logbook-waypoint/releases/download/v0.1.1/waypoint-cli.tar.gz.sha256)
      printf '%s  waypoint-cli.tar.gz\n' "$FAKE_CHECKSUM"
      ;;
    *)
      printf 'unexpected curl URL: %s\n' "$url" >&2
      exit 1
      ;;
  esac

  exit 0
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$(mktemp -d)"

cleanup() {
  local status=$?
  trap - EXIT
  rm -rf "$TEST_DIR"
  exit "$status"
}
trap cleanup EXIT

FAKE_BIN="$TEST_DIR/fake-bin"
FAKE_ARCHIVE="$TEST_DIR/waypoint-cli.tar.gz"
FAKE_CURL_LOG="$TEST_DIR/curl.log"
INSTALL_ROOT="$TEST_DIR/install"
BIN_DIR="$TEST_DIR/user-bin"
PAYLOAD_DIR="$TEST_DIR/payload"

mkdir -p "$FAKE_BIN" "$PAYLOAD_DIR/bin" "$PAYLOAD_DIR/lib"
ln -s "$ROOT_DIR/scripts/install.test.sh" "$FAKE_BIN/curl"
printf '#!/usr/bin/env node\nif (process.argv.includes("--version")) console.log("0.1.1");\n' > "$PAYLOAD_DIR/bin/cli.js"
printf 'export {};\n' > "$PAYLOAD_DIR/lib/server.js"
printf '{"name":"@logbookfordevs/waypoint","version":"0.1.1","type":"module"}\n' > "$PAYLOAD_DIR/package.json"
tar -czf "$FAKE_ARCHIVE" -C "$PAYLOAD_DIR" .
FAKE_CHECKSUM="$(shasum -a 256 "$FAKE_ARCHIVE" | awk '{print $1}')"
export FAKE_ARCHIVE FAKE_CHECKSUM FAKE_CURL_LOG

install_output="$(
  PATH="$FAKE_BIN:$PATH" \
  WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" \
  WAYPOINT_BIN_DIR="$BIN_DIR" \
  bash "$ROOT_DIR/scripts/install.sh" 2>&1
)"

grep -q 'releases/latest' "$FAKE_CURL_LOG"
grep -q 'releases/download/v0.1.1/waypoint-cli.tar.gz' "$FAKE_CURL_LOG"
test -f "$INSTALL_ROOT/releases/v0.1.1/bin/cli.js"
test -f "$INSTALL_ROOT/releases/v0.1.1/lib/server.js"
test -x "$BIN_DIR/waypoint"
"$BIN_DIR/waypoint" --version | grep -q '^0.1.1$'

printf '0%.0s' {1..64} > "$TEST_DIR/bad-checksum"
if PATH="$FAKE_BIN:$PATH" \
  FAKE_CHECKSUM="$(cat "$TEST_DIR/bad-checksum")" \
  WAYPOINT_INSTALL_ROOT="$TEST_DIR/bad-install" \
  WAYPOINT_BIN_DIR="$TEST_DIR/bad-bin" \
  bash "$ROOT_DIR/scripts/install.sh" >/dev/null 2>&1; then
  printf 'installer accepted an invalid checksum\n' >&2
  exit 1
fi

WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" \
WAYPOINT_BIN_DIR="$BIN_DIR" \
bash "$ROOT_DIR/scripts/install.sh" --unlink >/dev/null
test ! -e "$BIN_DIR/waypoint"

printf 'Waypoint installer contract passed\n'
