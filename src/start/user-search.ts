import { prisma } from '../db.js';

async function findMany(): Promise<any[]> {
  return await prisma.user.findMany({ select: { name: true, email: true } });
}

async function findActive(): Promise<any[]> {
  return await prisma.user.findMany({
    where: { active: true },
    select: { name: true, email: true },
  });
}

async function findByEmail(email: string): Promise<any> {
  return await prisma.user.findUnique({
    where: { email },
    omit: { id: true, active: true },
  });
}

findByEmail('email@domain.com')
  .then(console.log)
  .catch(({ message }) => console.log(message));
