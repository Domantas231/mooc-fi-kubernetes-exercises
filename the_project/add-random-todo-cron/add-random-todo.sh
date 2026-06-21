#!/bin/sh
# Adds a "Read <URL>" todo to the todo-backend, where <URL> is a random
# Wikipedia article. Intended to run inside the cluster (e.g. as a CronJob),
# reaching the backend through its Kubernetes service DNS name.
set -eu

# Kubernetes service DNS: <service>.<namespace>:<port>
BACKEND_HOST="${BACKEND_HOST:-todo-backend-svc.project}"
BACKEND_PORT="${BACKEND_PORT:-2345}"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}/todos"

RANDOM_WIKI_URL="https://en.wikipedia.org/wiki/Special:Random"

# Special:Random replies with a 302 redirect whose Location header points to the
# actual article. Ask for the server headers and grab the first Location, rather
# than downloading the page body. Works with both GNU and BusyBox wget.
wiki_url=$(wget -S -O /dev/null "$RANDOM_WIKI_URL" 2>&1 \
  | grep -i -m1 'Location:' \
  | sed 's/^[^:]*: *//' \
  | tr -d '\r')

if [ -z "$wiki_url" ]; then
  echo "Failed to resolve a random Wikipedia URL" >&2
  exit 1
fi

# Wikipedia returns a protocol-relative Location (//en.wikipedia.org/...).
# Normalize it to an absolute https:// URL.
case "$wiki_url" in
  //*) wiki_url="https:${wiki_url}" ;;
  http://*) wiki_url="https://${wiki_url#http://}" ;;
esac

todo_text="Read ${wiki_url}"

# Build the JSON body safely so the URL is properly escaped.
payload=$(printf '{"todo":"%s"}' "$todo_text")

echo "Adding todo: ${todo_text}"
wget -q -O - \
  --header='Content-Type: application/json' \
  --post-data="$payload" \
  "$BACKEND_URL"
echo
