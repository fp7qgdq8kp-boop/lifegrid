# LifeGrid VPS Deploy

This repo is set up so LifeGrid can live on the same VPS as Deadbot without sharing process state, ports, or database data.

## Separation model

- Repo folder: `/srv/lifegrid`
- App container: `lifegrid-app`
- Database container: `lifegrid-db`
- Public app port: `3010`
- Reverse proxy host: `lifegrid.example.com`
- Dedicated Postgres database and user for LifeGrid only

## Files added for VPS deployment

- `Dockerfile`
- `docker-compose.prod.yml`
- `.env.production.example`
- `ops/nginx/lifegrid.conf`

## First-time VPS setup

1. Clone the repo into its own folder:

```bash
git clone <your-lifegrid-repo-url> /srv/lifegrid
cd /srv/lifegrid
```

2. Create the production env file:

```bash
cp .env.production.example .env.production
```

3. Edit `.env.production` and set a strong `POSTGRES_PASSWORD`.

4. Build the image:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
```

5. Start only the database first:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d db
```

6. Bootstrap the schema and optional seed data:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml --profile manual run --rm init
```

7. Start the app:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d app
```

8. Point Nginx at port `3010` using `ops/nginx/lifegrid.conf`.

## Seed behavior

- `SEED_DATABASE=false` is the safe default for an existing server.
- Set `SEED_DATABASE=true` only for the first bootstrap if you want the Bentley Family sample data loaded.
- After the first run, turn it back off before re-running the `init` job.

## Updating on the VPS

```bash
cd /srv/lifegrid
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml --profile manual run --rm init
docker compose --env-file .env.production -f docker-compose.prod.yml up -d app
```

## Notes

- The app and database are intentionally isolated from Deadbot.
- If Deadbot already uses port `3010`, change `LIFEGRID_PUBLIC_PORT` in `.env.production`.
- This deploy flow uses `prisma db push` for now because the repo does not yet include Prisma migrations.
