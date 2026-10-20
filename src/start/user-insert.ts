import { prisma } from '../db.js';

const email = Math.random().toString(16).slice(2);

async function userInsert(): Promise<void> {
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Geraldo Bastos',
      email: `${email}@domain.com`,
      active: true,
    },
  });

  console.log('created:', user);
}

userInsert().catch(({ message }) => console.log(message));
