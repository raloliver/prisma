import { prisma } from '../db.js';

async function findMany(): Promise<any[]> {
  return await prisma.user.findMany();
}

async function findActive(): Promise<any[]> {
  return await prisma.user.findMany({
    where: { active: true },
    select: { name: true, email: true },
  });
}

findActive()
  .then(console.log)
  .catch(({ message }) => console.log(message));
