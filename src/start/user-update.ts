import { prisma } from '../db.js';
import type { User } from '../generated/prisma/client.js';

async function userUpdate(id: string, email: string): Promise<User> {
  return await prisma.user.update({
    where: { id },
    data: { email },
  });
}

userUpdate('9253fe18-0bf1-4c2f-92ce-a507cab7f478', 'email+0@domain.com')
  .then(console.log)
  .catch(({ message }) => console.log(message));
