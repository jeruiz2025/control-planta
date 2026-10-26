import { PrismaClient } from "@prisma/client";
import { calcularEdad } from "../lib/logica";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.persona.count();
  const grupos = await prisma.persona.groupBy({
    by: ["grupo"],
    _count: { _all: true },
  });
  const municipios = await prisma.persona.findMany({
    distinct: ["municipio"],
    select: { municipio: true },
  });
  const instituciones = await prisma.persona.findMany({
    distinct: ["institucion"],
    select: { institucion: true },
  });
  const personas = await prisma.persona.findMany({
    select: {
      fechaNacimiento: true,
      nivel: true,
      area: true,
      tipoInstitucion: true,
      correo: true,
      telefono: true,
      direccion: true,
    },
  });

  let m65 = 0;
  let m70 = 0;
  let sinNivel = 0;
  let sinArea = 0;
  let sinCorreo = 0;
  let sinTelefono = 0;
  let sinDireccion = 0;
  let ie = 0;
  let ce = 0;
  for (const p of personas) {
    const edad = calcularEdad(p.fechaNacimiento);
    if (edad !== null && edad >= 65) m65++;
    if (edad !== null && edad >= 70) m70++;
    if (!p.nivel) sinNivel++;
    if (!p.area) sinArea++;
    if (!p.correo) sinCorreo++;
    if (!p.telefono) sinTelefono++;
    if (!p.direccion) sinDireccion++;
    if (p.tipoInstitucion === "IE") ie++;
    if (p.tipoInstitucion === "CE") ce++;
  }

  console.log(
    JSON.stringify(
      {
        total,
        grupos: grupos.map((g) => ({ grupo: g.grupo, total: g._count._all })),
        municipios: municipios.length,
        instituciones: instituciones.length,
        mayores65: m65,
        mayores70: m70,
        sinNivel,
        sinArea,
        sinCorreo,
        sinTelefono,
        sinDireccion,
        tipoIE: ie,
        tipoCE: ce,
      },
      null,
      2
    )
  );

  const muestra = await prisma.persona.findMany({
    take: 2,
    orderBy: { id: "asc" },
  });
  console.log("\nMuestra:");
  console.log(JSON.stringify(muestra, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
