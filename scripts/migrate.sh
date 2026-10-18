#!/usr/bin/env bash
# Migration from the old Node server to the Rust server in Docker, in one go:
#   1. build the new image (dashboard, overlays and the rst server, see Dockerfile)
#   2. stop the running overlay container
#   3. back up the data volume as a tar.gz to migration-backups/ (old profiles under /data/streamers included) and
#      hand the volumes to the user rst of the new image (the old container wrote them as another user, the import
#      could not create data.db otherwise)
#   4. take over the old profiles with `rst import --from /data` (can run again, creates no duplicates)
#   5. start the container again as usual (with the public setup also Caddy)
# The old folders under /data/streamers stay; delete them by hand once everything works.
#
# Usage (in the repository folder, server.env filled in, see README):
#   scripts/migrate.sh            local setup (docker-compose.yml)
#   scripts/migrate.sh --public   public setup with Caddy (docker-compose.yml + docker-compose.public.yml)
set -euo pipefail

cd "$(dirname "$0")/.."
# Git Bash on Windows would rewrite container paths like /data into Windows paths; the host folder for the backup
# needs the Windows form there (pwd -W), elsewhere plain pwd
export MSYS_NO_PATHCONV=1
host_dir="$(pwd -W 2>/dev/null || pwd)"

compose=(docker compose)
case "${1:-}" in
  "") ;;
  --public) compose=(docker compose --env-file server.env -f docker-compose.yml -f docker-compose.public.yml) ;;
  *) echo "usage: scripts/migrate.sh [--public]" >&2; exit 2 ;;
esac

step() { printf '\n== %s\n' "$1"; }
fail() { printf 'migration stopped: %s\n' "$1" >&2; exit 1; }
# A shell in the new image without starting the server; extra docker options before the service name
as_root() { "${compose[@]}" run --rm --no-deps --user root --entrypoint sh "$@"; }

# Without the master key the server cannot encrypt anything; the import would fail after the container is down
[ -f server.env ] || fail "server.env is missing (copy server.env.example and fill it in)"
grep -Eq '^RST_MASTER_KEY=.+' server.env || fail "RST_MASTER_KEY is empty in server.env (openssl rand -base64 32)"
if [ "${1:-}" = "--public" ]; then
  grep -Eq '^DOMAIN=.+' server.env || fail "DOMAIN is empty in server.env"
fi

step "1/5 build the new image"
"${compose[@]}" build overlays

step "2/5 stop the overlay container"
"${compose[@]}" stop overlays

step "3/5 back up the data volume"
stamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p migration-backups
as_root -v "$host_dir/migration-backups:/backup" overlays -c "tar czf /backup/data-$stamp.tar.gz -C /data ."
echo "backup: migration-backups/data-$stamp.tar.gz"
as_root overlays -c "chown -R rst:rst /data /keys"

step "4/5 take over the old profiles"
if as_root overlays -c 'test -d /data/streamers'; then
  log="migration-backups/import-$stamp.log"
  set +e
  "${compose[@]}" run --rm --no-deps overlays rst import --from /data 2>&1 | tee "$log"
  status=${PIPESTATUS[0]}
  set -e
  # Exit code 1 with problems (e.g. triggers with back references) still imported everything else; a failed import
  # ("import failed: ...") leaves the container down so nothing runs on half-written data
  if grep -q '^import failed:' "$log"; then
    fail "the import failed, see $log; the old profiles are untouched, the backup is in migration-backups/"
  fi
  if [ "$status" -ne 0 ]; then
    echo "note: the import reported problems (lines with 'problem:' in $log); everything else was taken over"
  fi
else
  echo "no old profiles under /data/streamers, nothing to import"
fi

step "5/5 start the container again"
"${compose[@]}" up -d
"${compose[@]}" ps

printf '\nDone. Sign in again in the dashboard and check the overlays. Once everything works, the old folders can go:\n'
printf '  %s run --rm --no-deps --user root --entrypoint sh overlays -c "rm -rf /data/streamers"\n' "${compose[*]}"
