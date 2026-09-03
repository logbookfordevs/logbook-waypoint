#!/usr/bin/env bash
set -euo pipefail

fixture_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$fixture_dir"
}
trap cleanup EXIT

printf '%s\n' \
  '[[rules]]' \
  'id = "waypoint-synthetic-secret"' \
  'description = "Waypoint scanner self-test marker"' \
  "regex = '''WAYPOINT_SYNTHETIC_SECRET_[A-Z0-9]{24}'''" \
  > "$fixture_dir/gitleaks.toml"
printf 'WAYPOINT_SYNTHETIC_SECRET_7H3K9M2Q5R8T4V6X1Z0N3P7D\n' > "$fixture_dir/secret.txt"

set +e
gitleaks dir "$fixture_dir" \
  --config "$fixture_dir/gitleaks.toml" \
  --no-banner \
  --redact \
  --report-format json \
  --report-path "$fixture_dir/gitleaks-report.json" \
  >/dev/null 2>&1
gitleaks_status=$?
set -e

if [[ $gitleaks_status -ne 1 ]] ||
  ! jq -e 'any(.[]; .RuleID == "waypoint-synthetic-secret" and (.File | endswith("/secret.txt")))' "$fixture_dir/gitleaks-report.json" >/dev/null; then
  printf 'gitleaks did not report the expected synthetic fixture\n' >&2
  exit 1
fi

mkdir -p "$fixture_dir/.github/workflows"
printf '%s\n' \
  'name: Unsafe' \
  'on: push' \
  'jobs:' \
  '  unsafe:' \
  '    runs-on: ubuntu-latest' \
  '    steps:' \
  '      - uses: actions/checkout@v5' \
  > "$fixture_dir/.github/workflows/unsafe.yml"

set +e
zizmor --offline --format json "$fixture_dir/.github/workflows/unsafe.yml" > "$fixture_dir/zizmor-report.json" 2>/dev/null
zizmor_status=$?
set -e

if [[ $zizmor_status -eq 0 ]] ||
  ! jq -e 'any(.[]; .ident == "unpinned-uses")' "$fixture_dir/zizmor-report.json" >/dev/null; then
  printf 'zizmor did not report the expected unpinned action fixture\n' >&2
  exit 1
fi

if ! actionlint "$fixture_dir/.github/workflows/unsafe.yml" >/dev/null; then
  printf 'actionlint failed on the syntactically valid fixture\n' >&2
  exit 1
fi

printf 'security scanners rejected every synthetic unsafe fixture\n'
