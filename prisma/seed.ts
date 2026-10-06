import "dotenv/config";
import { prisma } from "../src/db.js";

const NAMES = ["Ada Lovelace", "Alan Turing", "Grace Hopper"];

async function main() {
  // `name` is not unique in the schema, so upsert-by-name isn't possible.
  // Guard on row count instead to keep the seed idempotent.
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log(`seed skipped — ${existing} user(s) already present`);
    return;
  }

  await prisma.user.createMany({ data: NAMES.map((name) => ({ name })) });
  console.log(`seeded ${NAMES.length} users`);
}

main()
  .catch((error: unknown) => {
    console.error("seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });