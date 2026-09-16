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
      printf 'https://github.com/logbookfordevs/logbook-waypoint/releases/tag/v0.1.4'
      ;;
    https://github.com/logbookfordevs/logbook-waypoint/releases/download/v0.1.4/waypoint-cli.tar.gz)
      cp "$FAKE_ARCHIVE" "$output_path"
      ;;
    https://github.com/logbookfordevs/logbook-waypoint/releases/download/v0.1.4/waypoint-cli.tar.gz.sha256)
      printf '%s  waypoint-cli.tar.gz\n' "$FAKE_CHECKSUM"
      ;;
    *)
      printf 'unexpected curl URL: %s\n' "$url" >&2
      exit 1
      ;;
  esac

  exit 0
fi

if [[ "$(basename "$0")" = "npx" ]]; then
  printf '%s\n' "$*" >> "$FAKE_NPX_LOG"
  exit 0
fi

if [[ "$(basename "$0")" = "afk" ]]; then
  printf '%s\n' "$*" >> "$FAKE_AFK_LOG"
  exit "${FAKE_SKILL_EXIT:-0}"
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
FAKE_NPX_LOG="$TEST_DIR/npx.log"
FAKE_AFK_LOG="$TEST_DIR/afk.log"
INSTALL_ROOT="$TEST_DIR/install"
BIN_DIR="$TEST_DIR/user-bin"
PAYLOAD_DIR="$TEST_DIR/payload"

mkdir -p "$FAKE_BIN" "$PAYLOAD_DIR/bin" "$PAYLOAD_DIR/lib" "$PAYLOAD_DIR/skills/waypoint"
ln -s "$ROOT_DIR/scripts/install.test.sh" "$FAKE_BIN/curl"
ln -s "$ROOT_DIR/scripts/install.test.sh" "$FAKE_BIN/npx"
ln -s "$(command -v node)" "$FAKE_BIN/node"
TEST_PATH="$FAKE_BIN:/usr/bin:/bin:/usr/sbin:/sbin"
printf '#!/usr/bin/env node\nif (process.argv.includes("--version")) console.log("0.1.4");\n' > "$PAYLOAD_DIR/bin/cli.js"
printf 'export {};\n' > "$PAYLOAD_DIR/lib/server.js"
printf '{"name":"@logbookfordevs/waypoint","version":"0.1.4","type":"module"}\n' > "$PAYLOAD_DIR/package.json"
printf '%s\n' '---' 'name: waypoint' 'description: Test skill.' '---' > "$PAYLOAD_DIR/skills/waypoint/SKILL.md"
tar -czf "$FAKE_ARCHIVE" -C "$PAYLOAD_DIR" .
FAKE_CHECKSUM="$(shasum -a 256 "$FAKE_ARCHIVE" | awk '{print $1}')"
export FAKE_ARCHIVE FAKE_CHECKSUM FAKE_CURL_LOG FAKE_NPX_LOG FAKE_AFK_LOG

install_output="$(
  PATH="$TEST_PATH" \
  WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" \
  WAYPOINT_BIN_DIR="$BIN_DIR" \
  WAYPOINT_INSTALL_SKILL=auto \
  bash "$ROOT_DIR/scripts/install.sh" 2>&1
)"

grep -q 'releases/latest' "$FAKE_CURL_LOG"
grep -q 'releases/download/v0.1.4/waypoint-cli.tar.gz' "$FAKE_CURL_LOG"
test -f "$INSTALL_ROOT/releases/v0.1.4/bin/cli.js"
test -f "$INSTALL_ROOT/releases/v0.1.4/lib/server.js"
test -x "$BIN_DIR/waypoint"
grep -Fxq -- "--yes skills@latest add $INSTALL_ROOT/releases/v0.1.4/skills/waypoint --global --agent universal --skill waypoint --yes" "$FAKE_NPX_LOG"
"$BIN_DIR/waypoint" --version | grep -q '^0.1.4$'

ln -s "$ROOT_DIR/scripts/install.test.sh" "$FAKE_BIN/afk"
npx_calls="$(wc -l < "$FAKE_NPX_LOG")"
PATH="$TEST_PATH" WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" WAYPOINT_BIN_DIR="$BIN_DIR" \
  WAYPOINT_INSTALL_SKILL=ask bash "$ROOT_DIR/scripts/install.sh" -y >/dev/null
grep -Fxq -- "skills add $INSTALL_ROOT/releases/v0.1.4/skills/waypoint --global --agent universal --skill waypoint --yes" "$FAKE_AFK_LOG"
test "$(wc -l < "$FAKE_NPX_LOG")" = "$npx_calls"
afk_calls="$(wc -l < "$FAKE_AFK_LOG")"
PATH="$TEST_PATH" WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" WAYPOINT_BIN_DIR="$BIN_DIR" \
  WAYPOINT_INSTALL_SKILL=auto bash "$ROOT_DIR/scripts/install.sh" --skip-skill >/dev/null
test "$(wc -l < "$FAKE_AFK_LOG")" = "$afk_calls"

# A later installer invocation (including waypoint update) preserves the opt-out.
PATH="$TEST_PATH" WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" WAYPOINT_BIN_DIR="$BIN_DIR" \
  WAYPOINT_INSTALL_SKILL=auto bash "$ROOT_DIR/scripts/install.sh" >/dev/null
test "$(wc -l < "$FAKE_AFK_LOG")" = "$afk_calls"

# Explicit opt-in overrides the preference; a failed skill does not fail the CLI.
failure_output="$(PATH="$TEST_PATH" WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" WAYPOINT_BIN_DIR="$BIN_DIR" \
  FAKE_SKILL_EXIT=1 bash "$ROOT_DIR/scripts/install.sh" --yes)"
[[ "$failure_output" = *"skill installation did not complete"* ]]
test -f "$INSTALL_ROOT/releases/v0.1.4/.waypoint-install.json"
grep -Fxq yes "$INSTALL_ROOT/.waypoint-skill-preference"
"$BIN_DIR/waypoint" --version | grep -q '^0.1.4$'
afk_calls="$(wc -l < "$FAKE_AFK_LOG")"
PATH="$TEST_PATH" WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" WAYPOINT_BIN_DIR="$BIN_DIR" \
  WAYPOINT_INSTALL_SKILL=auto bash "$ROOT_DIR/scripts/install.sh" >/dev/null
test "$(wc -l < "$FAKE_AFK_LOG")" -gt "$afk_calls"

printf '0%.0s' {1..64} > "$TEST_DIR/bad-checksum"
if PATH="$FAKE_BIN:$PATH" \
  FAKE_CHECKSUM="$(cat "$TEST_DIR/bad-checksum")" \
  WAYPOINT_INSTALL_ROOT="$TEST_DIR/bad-install" \
  WAYPOINT_BIN_DIR="$TEST_DIR/bad-bin" \
  WAYPOINT_INSTALL_SKILL=skip \
  bash "$ROOT_DIR/scripts/install.sh" >/dev/null 2>&1; then
  printf 'installer accepted an invalid checksum\n' >&2
  exit 1
fi

WAYPOINT_INSTALL_ROOT="$INSTALL_ROOT" \
WAYPOINT_BIN_DIR="$BIN_DIR" \
bash "$ROOT_DIR/scripts/install.sh" --unlink >/dev/null
test ! -e "$BIN_DIR/waypoint"

printf 'Waypoint installer contract passed\n'
