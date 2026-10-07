import { ESTADOS, TIPOS_NOVEDAD } from "@/lib/constantes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function distintos(campo: "municipio" | "institucion" | "cargo" | "grupo" | "vinculacion") {
  const filas = await prisma.persona.findMany({
    distinct: [campo],
    orderBy: { [campo]: "asc" },
    select: { [campo]: true },
  });
  return filas
    .map((f) => String(f[campo] ?? ""))
    .filter((v) => v.trim().length > 0);
}

export async function GET() {
  try {
    const [municipios, instituciones, cargos, grupos, vinculaciones] =
      await Promise.all([
        distintos("municipio"),
        distintos("institucion"),
        distintos("cargo"),
        distintos("grupo"),
        distintos("vinculacion"),
      ]);

    return Response.json({
      municipios,
      instituciones,
      cargos,
      grupos,
      vinculaciones,
      tiposNovedad: Object.entries(TIPOS_NOVEDAD).map(([tipo, clase]) => ({
        tipo,
        clase,
      })),
      estados: ESTADOS,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudieron cargar los catálogos" }, { status: 500 });
  }
}
