# prisma

A TypeScript + [Prisma](https://www.prisma.io/) project scaffold, wired up for a **SQLite** database.

> **Status:** early scaffolding. The repo is initialized on `main` but has no commits yet, there are
> no database models or migrations, and `src/index.ts` is still a placeholder. See
> [Current status](#current-status).

## Requirements

- Node.js v24 (built and verified against `v24.18.0`)
- npm 11+
- A `DATABASE_URL` environment variable pointing at your SQLite file

## Getting started

```bash
npm install

# create .env if it doesn't exist yet
# DATABASE_URL="file:./dev.db"

npm run dev
```

`npm run dev` runs `src/index.ts` through `tsx` (no build step, no compile).

### Database workflow

Migrations live in `prisma/migrations`, but that directory doesn't exist yet. Create it with the
first migration:

```bash
npx prisma migrate dev --name init   # applies migrations + generates the client
npx prisma studio                    # browse data in a GUI
```

Models belong in `prisma/schema.prisma`. After every schema change, re-run the migrate/generate
step so `src/generated/prisma` stays in sync — that output is gitignored and rebuilt from scratch
on each machine.

## Project structure

```
.
├── prisma/
│   └── schema.prisma        # datasource + generator config (no models defined yet)
├── prisma.config.ts         # Prisma CLI config (schema path, migrations path, engine, DB URL)
├── src/
│   └── index.ts             # entrypoint — currently prints "Hello Prisma"
├── .env                     # DATABASE_URL (gitignored)
└── .vscode/                 # Peacock theme (color #0F2E44)
```

### Generated code

The schema uses the `prisma-client` generator, which emits into source control's blind spot and is
committed nowhere:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

So the client is imported from the generated path rather than from `@prisma/client`, and
`/src/generated/prisma` appears in `.gitignore`. Note that `@prisma/client` is **not** a dependency
here — that's expected for this generator, since nothing imports the default package.

### Configuration notes

| Setting | Value | Where |
| --- | --- | --- |
| Datasource | `sqlite`, `env("DATABASE_URL")` | `prisma/schema.prisma` |
| Migrations path | `prisma/migrations` | `prisma.config.ts` |
| Engine | `classic` | `prisma.config.ts` |
| Client output | `src/generated/prisma` | `prisma/schema.prisma` |
| Module system | CommonJS (`"type": "commonjs"`), `nodenext` | `package.json`, `tsconfig.json` |

`tsconfig.json` is strict, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

## Current status

Working today:

- `npm run dev` prints `Hello Prisma`
- Prisma CLI resolves `DATABASE_URL` through `prisma.config.ts`
- Schema and config files are Prisma-valid

Not done yet:

- No models in `schema.prisma`, and no `prisma/migrations` directory
- No generated client (`src/generated/prisma` is empty until you run a migrate/generate)
- No database code in `src/index.ts`

### Known gaps

1. **`prisma.config.ts` fails typecheck.** `npx tsc --noEmit` reports `TS1295` errors: the file uses
   ESM `import`/`export` while `package.json` declares `"type": "commonjs"` and `tsconfig.json`
   sets `verbatimModuleSyntax`. The CLI itself runs fine (it transpiles independently), so this only
   shows up in editors and `tsc`. Fix by either adding
   `"prisma.config.ts"` to a separate config, or dropping `type`/`verbatimModuleSyntax` if ESM
   output is acceptable.

2. **`dotenv` is undeclared.** `prisma.config.ts` does `import "dotenv/config"`, but `dotenv` is
   only present transitively via `prisma` — it isn't in `package.json`. It works today and could
   break on a dependency bump. Prisma's own generated header suggests:
   `npm install --save-dev prisma dotenv`.

3. **`"types": []` in `tsconfig.json`** excludes `@types/node`, so Node globals like `console` aren't
   typed even though `@types/node` is installed.

4. **`.gitignore` lists `/src/generated/prisma` twice.** Harmless, but worth a cleanup.

## Scripts

| Script | Command |
| --- | --- |
| `npm run dev` | `tsx ./src/index.ts` |

There are no `build`, `test`, or `lint` scripts yet. Prisma CLI commands (`prisma migrate dev`,
`prisma generate`, `prisma studio`) are invoked via `npx` directly.

## Useful links

- [Prisma docs](https://www.prisma.io/docs)
- [Schema reference](https://www.prisma.io/docs/reference/prisma-schema-reference)
- [pris.ly/d/prisma-schema](https://pris.ly/d/prisma-schema) — annotated schema file