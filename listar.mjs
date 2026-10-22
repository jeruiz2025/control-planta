import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const r = await p.usuario.findMany({ select: { id: true, usuario: true, nombre: true, rol: true, activo: true } });
  console.log(JSON.stringify(r));
} finally {
  await p.$disconnect();
}
