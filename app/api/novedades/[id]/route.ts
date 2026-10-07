import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TIPOS_NOVEDAD } from "@/lib/constantes";
import { aISO, derivarNovedad } from "@/lib/logica";
import { aNovedadDTO } from "@/lib/serializacion";

export const dynamic = "force-dynamic";

async function idDe(ctx: RouteContext<"/api/novedades/[id]">) {
  const { id } = await ctx.params;
  return id;
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/novedades/[id]">) {
  try {
    const id = await idDe(ctx);
    const novedad = await prisma.novedad.findUnique({
      where: { id },
      include: { persona: true },
    });
    if (!novedad) {
      return Response.json({ error: "Novedad no encontrada" }, { status: 404 });
    }
    return Response.json(aNovedadDTO(novedad));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo cargar la novedad" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/novedades/[id]">) {
  try {
    const id = await idDe(ctx);
    const existente = await prisma.novedad.findUnique({ where: { id } });
    if (!existente) {
      return Response.json({ error: "Novedad no encontrada" }, { status: 404 });
    }
    const body = await req.json();

    const tipo =
      body.tipo !== undefined
        ? String(body.tipo).trim()
        : existente.tipo;
    if (!TIPOS_NOVEDAD[tipo]) {
      return Response.json({ error: "Tipo de novedad no válido" }, { status: 400 });
    }
    const estado =
      body.estado !== undefined
        ? String(body.estado).trim() || existente.estado
        : existente.estado;
    const desde =
      body.desde !== undefined ? aISO(body.desde) || null : existente.desde;
    const hasta =
      body.hasta !== undefined ? aISO(body.hasta) || null : existente.hasta;
    if (desde && hasta && hasta < desde) {
      return Response.json(
        { error: "La fecha final no puede ser anterior a la inicial" },
        { status: 400 }
      );
    }

    const actualizada = await prisma.novedad.update({
      where: { id },
      data: {
        tipo,
        estado,
        desde,
        hasta,
        fechaRegistro:
          body.fechaRegistro !== undefined
            ? aISO(body.fechaRegistro) || existente.fechaRegistro
            : existente.fechaRegistro,
        observacion:
          body.observacion !== undefined
            ? String(body.observacion).trim()
            : existente.observacion,
        ...derivarNovedad({ tipo, desde, hasta, estado }),
      },
      include: { persona: true },
    });
    return Response.json(aNovedadDTO(actualizada));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo actualizar la novedad" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/novedades/[id]">) {
  try {
    const id = await idDe(ctx);
    const existente = await prisma.novedad.findUnique({ where: { id } });
    if (!existente) {
      return Response.json({ error: "Novedad no encontrada" }, { status: 404 });
    }
    await prisma.novedad.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo eliminar la novedad" }, { status: 500 });
  }
}
