import { prisma } from '../db.js';

async function userInsert(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Maria José',
      email: 'email+1@domain.com',
    },
  });

  console.log('created:', user);
}

userInsert().catch(({ message }) => console.log(message));
