import { PrismaClient } from '@prisma/client';
import { verifyPassword } from './lib/password.ts';
const p = new PrismaClient();
const u = await p.usuario.findUnique({ where: { usuario: 'admin' } });
console.log(verifyPassword('Admin123*', u.hash));
await p.$disconnect();
