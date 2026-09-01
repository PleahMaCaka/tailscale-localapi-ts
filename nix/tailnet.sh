set -euo pipefail

CONTROL_URL="http://127.0.0.1:8080"
# unix sockets cannot be created on /mnt drvfs paths, so state never lives in the repo
DEV_DIR="${TAILSCALE_TS_DEV_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/tailscale.ts}"
SOCKET="$DEV_DIR/tailscaled.sock"
HS_DIR="$DEV_DIR/headscale"
TS_DIR="$DEV_DIR/tailscaled"
HS_PID="$DEV_DIR/headscale.pid"
TS_PID="$DEV_DIR/tailscaled.pid"
HS_LOG="$DEV_DIR/headscale.log"
API_KEY_FILE="$DEV_DIR/apikey"
TS_LOG="$DEV_DIR/tailscaled.log"

ts() { tailscale --socket="$SOCKET" "$@"; }
# every path in the config is relative, so the CLI must share headscale's working directory
hs() { (cd "$HS_DIR" && headscale --config config.yaml "$@"); }

running() {
  [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null
}

wait_for() {
  local name=$1 pidfile=$2 logfile=$3 probe=$4

  for _ in $(seq 1 60); do
    if ! running "$pidfile"; then
      echo "$name exited during startup:" >&2
      tail -5 "$logfile" >&2
      return 1
    fi

    if eval "$probe" >/dev/null 2>&1; then
      return 0
    fi

    sleep 0.5
  done

  echo "$name never became ready; see $logfile" >&2
  return 1
}

start_headscale() {
  running "$HS_PID" && return 0

  mkdir -p "$HS_DIR"
  [ -f "$HS_DIR/config.yaml" ] || install -m 644 "@headscaleConfig@" "$HS_DIR/config.yaml"

  cd "$HS_DIR"
  setsid headscale --config config.yaml serve >"$HS_LOG" 2>&1 </dev/null &
  echo $! >"$HS_PID"
  cd - >/dev/null

  wait_for headscale "$HS_PID" "$HS_LOG" "curl -fsS -o /dev/null $CONTROL_URL/health"
}

start_tailscaled() {
  running "$TS_PID" && return 0

  mkdir -p "$TS_DIR"
  setsid tailscaled \
    --tun=userspace-networking \
    --socket="$SOCKET" \
    --statedir="$TS_DIR" \
    --port=0 \
    --socks5-server=127.0.0.1:1055 \
    >"$TS_LOG" 2>&1 </dev/null &
  echo $! >"$TS_PID"

  wait_for tailscaled "$TS_PID" "$TS_LOG" "test -S $SOCKET"
}

join() {
  hs users create dev >/dev/null 2>&1 || true

  local user key
  user=$(hs users list --output json | jq -r '.[] | select(.name == "dev") | .id')
  key=$(hs preauthkeys create --user "$user" --reusable --expiration 24h --output json | jq -r '.key // .')

  ts up \
    --login-server "$CONTROL_URL" \
    --authkey "$key" \
    --hostname dev-node \
    --accept-dns=false \
    --accept-routes=false
}

issue_api_key() {
  [ -s "$API_KEY_FILE" ] && return 0

  hs apikeys create --expiration 24h 2>/dev/null | tail -1 > "$API_KEY_FILE"
  chmod 600 "$API_KEY_FILE"
}

backend_state() {
  ts status --json 2>/dev/null | jq -r '.BackendState // "Unknown"'
}

stop() {
  local pidfile=$1 name=$2

  if running "$pidfile"; then
    kill "$(cat "$pidfile")" 2>/dev/null || true
    echo "stopped $name"
  fi

  rm -f "$pidfile"
}

case "${1:-up}" in
up)
  mkdir -p "$DEV_DIR"
  start_headscale
  start_tailscaled
  issue_api_key
  [ "$(backend_state)" = "Running" ] || join

  echo "tailnet up"
  echo "  control  $CONTROL_URL"
  echo "  socket   $SOCKET"
  echo "  state    $(backend_state)"
  echo "  api key  $API_KEY_FILE"
  echo
  echo "  eval \"\$(tailnet env)\"   to export it into this shell"
  ;;
env)
  echo "export TAILSCALE_LOCALAPI_SOCKET=$SOCKET"
  echo "export HEADSCALE_URL=$CONTROL_URL"
  [ -s "$API_KEY_FILE" ] && echo "export HEADSCALE_API_KEY=$(cat "$API_KEY_FILE")"
  ;;
status)
  running "$HS_PID" && echo "headscale  running" || echo "headscale  stopped"
  running "$TS_PID" && echo "tailscaled running" || echo "tailscaled stopped"
  [ -S "$SOCKET" ] && ts status
  ;;
down)
  stop "$TS_PID" tailscaled
  stop "$HS_PID" headscale
  ;;
reset)
  stop "$TS_PID" tailscaled
  stop "$HS_PID" headscale
  rm -rf "$DEV_DIR"
  echo "deleted $DEV_DIR"
  ;;
*)
  echo "usage: tailnet [up|env|status|down|reset]" >&2
  exit 1
  ;;
esac
