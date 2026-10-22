import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const usuario = (process.env.ADMIN_USUARIO ?? "admin").trim();
  const clave = process.env.ADMIN_CLAVE ?? "Admin123*";
  const nombre = process.env.ADMIN_NOMBRE ?? "Administrador";

  const existente = await prisma.usuario.findUnique({ where: { usuario } });
  if (existente) {
    console.log(`El usuario "${usuario}" ya existe. No se modificó.`);
    return;
  }

  await prisma.usuario.create({
    data: {
      usuario,
      nombre,
      hash: hashPassword(clave),
      rol: "admin",
      activo: true,
    },
  });
  console.log(`Usuario administrador "${usuario}" creado.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
