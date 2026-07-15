#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/Documents/bringhome/bringhome/.tools/node-v22.16.0-darwin-arm64/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

mkdir -p .logs
PID_FILE=".logs/vite-dev.pid"
LOG_FILE=".logs/vite-dev.log"
PORT=5173

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Already running: http://127.0.0.1:$PORT (PID $(cat "$PID_FILE"))"
    exit 0
  fi
fi

if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:"$PORT" -sTCP:LISTEN | xargs kill 2>/dev/null || true
  sleep 1
fi

nohup ./node_modules/.bin/vite --host 127.0.0.1 --port "$PORT" >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
sleep 1

if kill -0 "$(cat "$PID_FILE")" 2>/dev/null && lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Started: http://127.0.0.1:$PORT"
  echo "PID $(cat "$PID_FILE") | log: $LOG_FILE"
  echo "Stop: kill \$(cat $PID_FILE)"
else
  echo "Failed to start. See $LOG_FILE:"
  tail -n 30 "$LOG_FILE" || true
  exit 1
fi
