import { prisma } from '../db.js';

async function findMany(): Promise<any[]> {
  return await prisma.user.findMany();
}

findMany()
  .then(console.log)
  .catch(({ message }) => console.log(message));
