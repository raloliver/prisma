import { prisma } from '../db.js';
import type { User } from '../generated/prisma/client.js';

const user: User = {
  // id: crypto.randomUUID(),
  id: '8159f0a3-2af3-4725-baad-b5ea9abff895',
  name: 'Alan Turing',
  email: 'email+4@domain.com',
  active: true,
};

async function userUpsert(user: User): Promise<User> {
  return await prisma.user.upsert({
    create: user,
    update: user,
    where: { id: user.id ?? '' },
  });
}

userUpsert(user)
  .then(console.log)
  .catch(({ message }) => console.log(message));
