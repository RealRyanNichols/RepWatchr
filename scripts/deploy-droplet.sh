#!/usr/bin/env bash
# Run on the existing leadflow-web host. Builds never touch the serving tree.
set -Eeuo pipefail
umask 027
exec 9>/run/lock/repwatchr-release.lock
flock -n 9 || { echo 'RepWatchr release already running'; exit 0; }
repo=/srv/sites/repwatchr
releases=/srv/repwatchr-releases
env_file=/srv/site-env/repwatchr.env
override_dir=/etc/systemd/system/site@repwatchr.service.d
override=$override_dir/release.conf
mkdir -p "$releases" "$override_dir"
git -C "$repo" fetch origin main --quiet
sha=$(git -C "$repo" rev-parse origin/main)
current=$(curl -fsS --max-time 10 http://127.0.0.1:3102/api/health/release | node -e 'let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{try{console.log(JSON.parse(s).release||"")}catch{}})' || true)
if [[ "$current" == "$sha" ]]; then echo "Already serving $sha"; exit 0; fi
release=$(mktemp -d "$releases/${sha:0:12}-XXXXXX")
git -C "$repo" archive "$sha" | tar -x -C "$release"
cd "$release"
set -a
source "$env_file"
set +a
export REPWATCHR_HOSTING=DigitalOcean REPWATCHR_RELEASE_SHA="$sha"
export NEXT_TELEMETRY_DISABLED=1
npm ci --include=dev --no-audit --no-fund
for check in qa:static smoke:sources smoke:pricing smoke:seo smoke:og smoke:thumbnails smoke:mobile-pwa; do
  npm run "$check"
done
node scripts/test-command-center.mjs
npm run lint
npm run build
# Candidate binds only to loopback. Main service stays up throughout the build.
candidate_pid=
cleanup() { if [[ -n "$candidate_pid" ]]; then kill "$candidate_pid" 2>/dev/null || true; fi; }
trap cleanup EXIT
node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3202 > "$release/candidate.log" 2>&1 &
candidate_pid=$!
ready=false
for attempt in {1..20}; do
  if curl -fsS --max-time 3 http://127.0.0.1:3202/api/health/release > /dev/null; then ready=true; break; fi
  kill -0 "$candidate_pid" || exit 1
  sleep 1
done
[[ "$ready" == true ]]
REPWATCHR_SMOKE_BASE_URL=http://127.0.0.1:3202 npm run qa:routes -- --allow-known-gaps
npm run verify:marion-deploy -- http://127.0.0.1:3202
status=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' http://127.0.0.1:3202/admin/command-center)
[[ "$status" == 307 ]]
cp -a "$override" "$release/previous-release.conf" 2>/dev/null || true
cat > "$override" <<EOF
[Service]
WorkingDirectory=$release
ReadWritePaths=
ReadWritePaths=$release
ExecStart=
ExecStart=/usr/bin/node $release/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3102
Environment=REPWATCHR_HOSTING=DigitalOcean
Environment=REPWATCHR_RELEASE_SHA=$sha
EOF
rollback() {
  if [[ -f "$release/previous-release.conf" ]]; then cp "$release/previous-release.conf" "$override"; else rm -f "$override"; fi
  systemctl daemon-reload
  systemctl restart site@repwatchr
  echo "Release failed; restored previous service configuration" >&2
}
systemctl daemon-reload
if ! systemctl restart site@repwatchr; then rollback; exit 1; fi
ready=false
for attempt in {1..20}; do
  if curl -fsS --max-time 3 http://127.0.0.1:3102/api/health/release | grep -Fq "$sha"; then ready=true; break; fi
  sleep 1
done
if [[ "$ready" != true ]]; then rollback; exit 1; fi
systemctl enable site@repwatchr
printf '%s\n' "$release" > "$releases/current-path"
echo "VERIFIED: $sha serving on 3102; release $release"
