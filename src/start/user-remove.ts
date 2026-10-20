import { prisma } from '../db.js';
import type { User } from '../generated/prisma/client.js';

async function userRemove(id: string): Promise<User> {
  return await prisma.user.delete({
    where: { id },
  });
}

userRemove('74d27ee3-fa45-4f51-a8c1-5ddcb30af9da')
  .then(console.log)
  .catch(({ message }) => console.log(message));
