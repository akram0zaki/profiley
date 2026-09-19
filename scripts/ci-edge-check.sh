#!/bin/sh
# Type-check every edge function entrypoint.
#
# Shared by GitHub Actions (.github/workflows/ci.yml) and the local pre-push
# hook so both run exactly the same check.
#
# Runs from supabase/ on purpose: from the repo root Deno picks up the root
# package.json and demands npm type packages (@types/node) that only exist for
# the frontend workspace.
set -eu

cd "$(dirname "$0")/.."/supabase

status=0
for f in functions/*/index.ts; do
  [ -e "$f" ] || continue
  printf 'deno check %s\n' "$f"
  if ! deno check --no-lock --quiet "$f"; then
    status=1
  fi
done

exit "$status"
