#!/bin/sh
# What the node container runs on every start (see docker-compose.yml). Installs packages only when
# a package-lock changed and builds the frontend only when its sources changed, so a restart after
# a `git pull` picks up the new code, and a plain restart is quick.
set -e
cd /app

# npm ci when the lock file (or how we install) differs from what the current node_modules came from
install() {
    dir=$1; shift
    stamp="$dir/node_modules/.installed-lock"
    expected=$( (cat "$dir/package-lock.json"; echo "npm ci $*") | cksum)
    if [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$expected" ]; then
        echo "== installing packages in $dir"
        (cd "$dir" && npm ci --no-audit --no-fund "$@")
        # (a package with nothing to install gets no node_modules of its own)
        mkdir -p "$dir/node_modules"
        echo "$expected" > "$stamp"
    fi
}

install shared --omit=dev
install backend --omit=dev
# building the frontend needs its dev tools (webpack, babel), also when NODE_ENV is production
install frontend --include=dev

# build the frontend (into backend/public) when anything it is made of is newer than the last build
built=backend/public/main.js
if [ ! -f "$built" ] || [ -n "$(find frontend/src frontend/public frontend/content frontend/webpack.config.js shared \
        -path '*/node_modules' -prune -o -type f -newer "$built" -print -quit)" ]; then
    echo "== building the frontend"
    (cd frontend && npm run build)
fi

echo "== starting the game server"
cd backend
exec node index.mjs
