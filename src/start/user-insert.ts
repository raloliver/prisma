import { prisma } from '../db.js';

async function userInsert(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Antonio dos Santos',
      email: 'email+2@domain.com',
      active: true
    },
  });

  console.log('created:', user);
}

userInsert().catch(({ message }) => console.log(message));
