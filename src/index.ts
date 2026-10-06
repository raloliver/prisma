import "dotenv/config";
import { prisma } from "./db.js";

// `@default(uuid())` generates a random v4 client-side, so the id carries no
// timestamp. Sorting by id therefore gives random order, NOT insertion order.
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function main() {
  console.log("Hello Prisma");

  // create — the id is generated client-side, not by the database
  const user = await prisma.user.create({
    data: { name: "Ada Lovelace" },
    select: { id: true, name: true },
  });
  console.log("created:", user);
  console.log("id is a valid v4 uuid:", UUID_V4.test(user.id));

  // a v4 id is client-assignable, which an autoincrement id never is
  const chosen = crypto.randomUUID();
  const supplied = await prisma.user.create({
    data: { id: chosen, name: "Alan Turing" },
    select: { id: true, name: true },
  });
  console.log("created with a client-supplied id:", supplied.id === chosen);

  // read all — deliberately no `orderBy`, because ordering by a v4 id is random
  const all = await prisma.user.findMany({
    select: { id: true, name: true },
  });
  console.log("all users:", all);

  // aggregate
  console.log("total:", await prisma.user.count());

  // read one back by primary key
  const found = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });
  console.log("found by id:", found?.name);

  // v4 ids are opaque, so treat them as identifiers only and filter on real
  // columns (e.g. name/email) rather than trying to infer anything from the id
  const byName = await prisma.user.findFirst({
    where: { name: "Alan Turing" },
    select: { id: true },
  });
  console.log("found by name:", byName?.id);

  // clean up so re-runs stay tidy
  await prisma.user.deleteMany({
    where: { id: { in: [user.id, supplied.id] } },
  });
  console.log("deleted test rows");
}

main()
  .catch((error: unknown) => {
    console.error("failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });