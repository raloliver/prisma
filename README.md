# prisma

TypeScript + **Prisma 7** with **SQLite**, using the Rust-free client and the `better-sqlite3`
driver adapter.

- **Prisma** `7.10.0` — Rust-free TypeScript query compiler (no query engine binaries)
- **SQLite** via `@prisma/adapter-better-sqlite3` + `better-sqlite3`
- **ESM only** (`"type": "module"`) — required by Prisma 7
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)

> **Status:** working end-to-end. One `User` model, one applied migration, a seed script, and a
> runnable demo script that creates, reads, aggregates, and deletes a row.

## Requirements

- Node.js **>= 20.19** (built and verified on v24.18.0)
- npm 11+ (ships a prebuilt `better-sqlite3` binary for Windows/macOS/Linux)
- TypeScript **>= 5.4** (project uses 7.0.2)

## Getting started

```bash
npm install
cp .env.example .env        # Linux/macOS: cp .env.example .env
npm run generate            # required after every fresh clone
npm run migrate:deploy      # create the SQLite file and apply migrations
npm run seed                # optional: 3 sample users
npm run dev
```

> `.env` is gitignored, so it does not exist on a fresh clone. Copy it before running any Prisma
> command — see [Why `prisma generate` needs `.env`](#why-prisma-generate-needs-env).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Runs `src/index.ts` through `tsx` (no build step) |
| `npm run build` | Typecheck, then bundle to `dist/index.js` with esbuild |
| `npm start` | Run the bundle from `dist/` |
| `npm run typecheck` | `tsc` — typechecking only, emits nothing |
| `npm run generate` | Generate Prisma Client into `src/generated/prisma` |
| `npm run migrate` | `prisma migrate dev` — create + apply a migration (dev) |
| `npm run migrate:deploy` | `prisma migrate deploy` — apply migrations (CI/prod) |
| `npm run studio` | `prisma studio` — browse data in a GUI |
| `npm run seed` | `prisma db seed` — runs `prisma/seed.ts` |

## Project structure

```
.
├── prisma/
│   ├── migrations/          # committed SQL migrations
│   ├── schema.prisma        # generator + datasource + User model
│   └── seed.ts              # idempotent seed script
├── src/
│   ├── db.ts                # PrismaClient singleton + driver adapter
│   ├── index.ts             # demo entrypoint (CRUD)
│   └── generated/prisma/    # generated client — gitignored
├── prisma.config.ts         # CLI config: schema path, migrations, DATABASE_URL
├── .env                     # DATABASE_URL (gitignored)
├── .env.example             # template
└── dev.db                   # SQLite file (gitignored)
```

## How v7 is wired

### Client singleton — `src/db.ts`

Prisma 7 requires a **driver adapter** for every database, so the client is constructed with one:

```ts
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma = new PrismaClient({ adapter });
```

The client is cached on `globalThis` so `tsx` reloads don't open a new connection each run.
Import it from `./db.js` anywhere instead of constructing your own.

### Schema — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model User {
  id   Int    @id @default(autoincrement())
  name String

  @@map("users")
}
```

Two v7 details worth noting:

- `provider = "prisma-client"` is the Rust-free generator. `prisma-client-js` is deprecated.
- `output` is **required** — the client is no longer written into `node_modules`.
- The `url` field is **gone from the datasource block**; v7 reads it from `prisma.config.ts`.

### Config — `prisma.config.ts`

Prisma 7 does **not** load `.env` on its own, so the config imports `dotenv/config` explicitly:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
```

The v6 `engine: "classic"` option was removed — there is no Rust engine to select.

## Why the build uses esbuild

`tsc` alone **cannot** produce runnable output here. Prisma 7's generated client emits
extensionless relative imports (`import ... from "./enums"`), which `tsx` resolves but Node's native
ESM loader rejects:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../dist/generated/prisma/enums'
```

So `npm run build` typechecks with `tsc`, then bundles with esbuild — which resolves those
specifiers at build time:

```bash
esbuild src/index.ts --bundle --platform=node --target=node20 \
  --format=esm --outfile=dist/index.js --packages=external
```

`--packages=external` keeps `node_modules` dependencies (including the native `better-sqlite3`
binary) external and unbundled.

If you only ever run `npm run dev`, you can ignore the build entirely.

## Why `prisma generate` needs `.env`

`prisma.config.ts` calls `env("DATABASE_URL")`, which **throws** when the variable is missing —
even for `prisma generate`, which never touches the database. Since `.env` is gitignored, that
breaks any command run before you copy it. Two consequences, both deliberate:

- There is **no `postinstall: prisma generate`** script. Otherwise `npm install` on a fresh clone
  would fail, because `.env` does not exist yet.
- `env()` is kept over a `process.env.DATABASE_URL ?? "file:./dev.db"` fallback. A silent default
  would let `prisma migrate deploy` quietly target the wrong database if `DATABASE_URL` were unset
  in CI. Failing loudly is safer.

## Migrating from v6

```bash
npm install @prisma/client@7 @prisma/adapter-better-sqlite3 better-sqlite3
npm install -D prisma@7 dotenv
```

| Change | v6 | v7 (this repo) |
| --- | --- | --- |
| Package format | CommonJS | ESM — `"type": "module"` |
| Generator | `prisma-client-js` | `prisma-client` (Rust-free) |
| Client location | `node_modules/@prisma/client` | `src/generated/prisma` |
| Datasource `url` | `env("DATABASE_URL")` in schema | moved to `prisma.config.ts` |
| Connection | built-in Rust engine | driver adapter (`PrismaBetterSqlite3`) |
| `.env` loading | automatic | explicit `import "dotenv/config"` |
| `engine: "classic"` | supported | removed |
| Auto-generate | `migrate dev` did it | run `prisma generate` yourself |
| Auto-seed | `migrate dev` did it | run `prisma db seed` yourself |
| `--skip-generate` | supported | **removed** |

Also note: `prisma migrate dev` no longer runs `prisma generate`, so run both after a schema change:

```bash
npm run migrate && npm run generate
```

## Primary key: `uuid()` (v4)

`User.id` is a `String` primary key with a client-generated **v4** UUID:

```prisma
model User {
  id   String    @id @default(uuid())
  name String

  @@map("users")
}
```

Autoincrement and UUID cannot be combined — `String @id @default(autoincrement())` is a hard error
(`P1012`: *"`autoincrement()` cannot be used on fields of type `String`"*), because autoincrement
maps to a database sequence. Pick one:

| | `Int @default(autoincrement())` | `String @default(uuid())` |
| --- | --- | --- |
| Who assigns the id | database | client, before insert |
| Insertion order | Implicit | **Lost** — random |
| Client-assignable ids | No | Yes |
| Merge / replication | Id conflicts possible | No conflicts |
| Index size, join cost | Small, fast | 36-char text key, slower |
| Leaks row count | Yes | No |

### What v4 means in practice

- **Never `orderBy: { id }` expecting "newest first."** v4 is random with no time component, so
  ordering by it returns arbitrary rows. Add a `createdAt DateTime @default(now())` column if you
  need recency.
- **Don't infer anything from the id** — it's opaque, not sequential.
- The id is generated **client-side**, so it exists before the insert and you may supply your own
  (`crypto.randomUUID()`). `src/index.ts` demonstrates both.
- Stored as `TEXT` in SQLite, so there is no native `UUID` type to map to.

### If you later want sortable ids

`@default(uuid(7))` is also supported in Prisma 7 and embeds a timestamp, so `orderBy: { id }`
becomes chronological again:

```
--- uuid() v4 ---   orderBy id ASC == insertion order? false -> second,third,first
--- uuid(7) ---     orderBy id ASC == insertion order? true  -> first,second,third
```

Either way, changing the PK type drops and recreates the table — development only.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL` | `.env` missing | `cp .env.example .env` |
| `ERR_MODULE_NOT_FOUND` on `./generated/...` | running `tsc` output directly | use `npm run build`, or `npm run dev` |
| `Cannot find module .../runtime/client` | `@prisma/client` not installed | `npm install @prisma/client@7` |
| better-sqlite3 build errors | install scripts blocked | `npm approve-scripts` then reinstall |
| `Table does not exist` | migrations not applied | `npm run migrate:deploy` |

## Useful links

- [Upgrade to v7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [SQLite connector](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Prisma Config reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [pris.ly/d/prisma-schema](https://pris.ly/d/prisma-schema) — annotated schema file