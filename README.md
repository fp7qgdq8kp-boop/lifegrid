# LifeGrid

LifeGrid is a dark, focused life progress dashboard for major goals, milestones, blockers, next actions, weekly reviews, and household-level momentum.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Prisma
- PostgreSQL

## MVP included

- Dashboard with overall progress, pillar progress, active goals, stuck goals, next actions, recent wins, and activity
- Life Pillars view
- Goals list
- Goal detail page with progress history, milestones, and related activity
- Goal create and edit flows
- Progress update flow with activity logging
- Milestone add and complete flows
- Weekly review creation and history
- Seed data for the Bentley Family household
- Auth stub via the first seeded household member

## Local setup

1. Install Node.js.
2. Start PostgreSQL with Docker:

```bash
docker compose up -d
```

3. Copy the environment file and update it if needed:

```bash
Copy-Item .env.example .env
```

4. Install dependencies:

```bash
npm install
```

5. Generate Prisma client, push the schema, and seed the database:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

## Notes

- The project is structured so real authentication can replace the current seeded viewer context later.
- Progress for checklist goals is derived from completed milestones.
- Overall progress is the average of pillar progress, and pillar progress is the average of active goals in that pillar.

## VPS deployment

LifeGrid can live on the same VPS as Deadbot while staying separate:

- Separate folder
- Separate Docker compose stack
- Separate container names
- Separate Postgres database
- Separate public port
- Separate reverse proxy host

Deployment files are included:

- [Dockerfile](./Dockerfile)
- [docker-compose.prod.yml](./docker-compose.prod.yml)
- [ops/VPS-DEPLOY.md](./ops/VPS-DEPLOY.md)
- [ops/nginx/lifegrid.conf](./ops/nginx/lifegrid.conf)

Suggested layout on the VPS:

- Deadbot: `/srv/deadbot`
- LifeGrid: `/srv/lifegrid`
- Deadbot and LifeGrid should not share `.env` files, ports, or databases.
