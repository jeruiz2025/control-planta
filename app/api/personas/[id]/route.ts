import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { aISO } from "@/lib/logica";
import { aNovedadDTO, aPersonaDTO } from "@/lib/serializacion";

export const dynamic = "force-dynamic";

async function idDe(ctx: RouteContext<"/api/personas/[id]">) {
  const { id } = await ctx.params;
  return Number(id);
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/personas/[id]">) {
  try {
    const id = await idDe(ctx);
    const persona = await prisma.persona.findUnique({
      where: { id },
      include: { novedades: { orderBy: { fechaRegistro: "desc" } } },
    });
    if (!persona) {
      return Response.json({ error: "Persona no encontrada" }, { status: 404 });
    }
    const { novedades, ...resto } = persona;
    return Response.json({
      ...aPersonaDTO(resto),
      novedades: novedades.map(aNovedadDTO),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo cargar la persona" }, { status: 500 });
  }
}

const CAMPOS = [
  "municipio",
  "institucion",
  "sede",
  "grupo",
  "cargo",
  "nombre",
  "cedula",
  "vinculacion",
  "novedadAnterior",
] as const;

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/personas/[id]">) {
  try {
    const id = await idDe(ctx);
    const existente = await prisma.persona.findUnique({ where: { id } });
    if (!existente) {
      return Response.json({ error: "Persona no encontrada" }, { status: 404 });
    }
    const body = await req.json();
    const datos: Record<string, string> = {};
    for (const campo of CAMPOS) {
      if (body[campo] !== undefined) datos[campo] = String(body[campo] ?? "").trim();
    }
    if (datos.nombre !== undefined && !datos.nombre) {
      return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    if (datos.cedula) {
      const duplicada = await prisma.persona.findFirst({
        where: { cedula: datos.cedula, id: { not: id } },
      });
      if (duplicada) {
        return Response.json(
          { error: `Ya existe otra persona con la cédula ${datos.cedula}` },
          { status: 409 }
        );
      }
    }
    if (body.fechaNacimiento !== undefined) {
      datos.fechaNacimiento = aISO(body.fechaNacimiento);
    }
    const actualizada = await prisma.persona.update({ where: { id }, data: datos });
    return Response.json(aPersonaDTO(actualizada));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo actualizar la persona" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/personas/[id]">) {
  try {
    const id = await idDe(ctx);
    const existente = await prisma.persona.findUnique({ where: { id } });
    if (!existente) {
      return Response.json({ error: "Persona no encontrada" }, { status: 404 });
    }
    await prisma.persona.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo eliminar la persona" }, { status: 500 });
  }
}
