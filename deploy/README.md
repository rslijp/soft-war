# Hosting SoftWar on your own server

Two stock Docker images, nothing to build:

- **app**: `node:24` runs the code straight from this repository, mounted as `/app`. On every
  start `start.sh` installs packages and builds the frontend, but only when something changed,
  then starts the game server.
- **mongo**: `mongo:7`, with its data in a Docker volume. Only the app can reach it.
- **caddy** (optional): `caddy:2` in front, for HTTPS with automatic Let's Encrypt certificates.

Your settings come from `backend/.env` and are passed to the app as environment variables.

## First time

1. Install Docker with the compose plugin, and clone the repository on the server:

   ```sh
   git clone https://github.com/rslijp/soft-war.git && cd soft-war
   ```

2. Create `backend/.env` from `backend/.env.example`:
   - `SESSION_SECRET`: a long random string, for example from `openssl rand -hex 32`.
   - `MONGODB=softwar`. You can leave `ATLAS_URI` out: the compose file points the app at the
     Mongo container.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
   - `GOOLGE_REDIRECT_URL=https://<your domain>/auth/google/callback`. Add the same URL to the
     OAuth client's authorized redirect URIs in the Google Cloud console.
   - `SENDGRID_API_KEY`.

3. Create `deploy/.env` for compose itself:

   ```sh
   UID=1000            # your user id (id -u), so the files the container writes are yours
   GID=1000            # your group id (id -g)
   APP_PORT=3000       # where the game listens on the server
   DOMAIN=game.example.com   # only for the https profile
   ```

4. Start it:

   ```sh
   cd deploy
   docker compose --profile https up -d     # with Caddy: HTTPS on DOMAIN (ports 80 and 443)
   # or, when you already have a proxy (nginx, ...) that does HTTPS and passes X-Forwarded-Proto:
   docker compose up -d                     # the game on APP_PORT
   ```

   The first start installs everything and builds the frontend, which takes a minute or two.
   Follow it with `docker compose logs -f app` until it says `Listening on port 3000`.

The server sends every visitor to https unless the proxy in front says they already came in over
https. Only for a quick try without any proxy, add `FORCE_HTTPS=false` to `backend/.env`.

## Updating

```sh
git pull
cd deploy && docker compose restart app
```

The restart only reinstalls packages when a `package-lock.json` changed, and only rebuilds the
frontend when its sources changed. A plain restart is back in seconds.

## Day to day

- **Logs:** `docker compose logs -f app`
- **Stop:** `docker compose stop`. The games stay in the `mongo-data` volume.
- **Back up the database:**

  ```sh
  docker compose exec mongo mongodump --db softwar --archive > softwar-$(date +%F).archive
  ```

- **Restore a backup, or move your games from another Mongo:**

  ```sh
  docker compose exec -T mongo mongorestore --archive < softwar-2026-11-01.archive
  ```

  For example, export your local games with
  `docker exec softwar-mongo mongodump --db softwar --archive > local.archive`, then restore that
  file on the server.

## Good to know

- **Logins** live in the server's memory (express-session's default store). After a restart,
  players log in again; their games are safe in Mongo.
- **Boot mail:** on every start in production the server sends a test mail (`sendTestMail` in
  `backend/mailer.mjs`).
- **The mount:** the app container writes into the repository on the server (`node_modules` and
  `backend/public`). That's why it runs as your user (`UID`/`GID`).
