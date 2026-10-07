import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TIPOS_NOVEDAD } from "@/lib/constantes";
import { aISO, derivarNovedad } from "@/lib/logica";
import { aNovedadDTO } from "@/lib/serializacion";
import { buscarNovedades } from "@/lib/consultas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const resultado = await buscarNovedades(params);
    return Response.json(resultado);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudieron cargar las novedades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tipo = String(body.tipo ?? "").trim();
    if (!TIPOS_NOVEDAD[tipo]) {
      return Response.json({ error: "Tipo de novedad no válido" }, { status: 400 });
    }
    const estado = String(body.estado ?? "Pendiente").trim() || "Pendiente";

    let personaId = body.personaId ? Number(body.personaId) : null;
    if (!personaId) {
      const cedula = String(body.cedula ?? "").trim();
      const persona = cedula
        ? await prisma.persona.findFirst({ where: { cedula } })
        : null;
      if (!persona) {
        return Response.json(
          { error: "No hay persona con esa cédula en la planta" },
          { status: 400 }
        );
      }
      personaId = persona.id;
    }

    const existente = await prisma.persona.findUnique({ where: { id: personaId } });
    if (!existente) {
      return Response.json(
        { error: "No hay persona con esa cédula en la planta" },
        { status: 400 }
      );
    }

    const desde = aISO(body.desde) || null;
    const hasta = aISO(body.hasta) || null;
    if (desde && hasta && hasta < desde) {
      return Response.json(
        { error: "La fecha final no puede ser anterior a la inicial" },
        { status: 400 }
      );
    }
    const creada = await prisma.novedad.create({
      data: {
        personaId,
        fechaRegistro: aISO(body.fechaRegistro) || aISO(new Date()),
        tipo,
        desde,
        hasta,
        estado,
        observacion: String(body.observacion ?? "").trim(),
        ...derivarNovedad({ tipo, desde, hasta, estado }),
      },
      include: { persona: true },
    });
    return Response.json(aNovedadDTO(creada), { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo crear la novedad" }, { status: 500 });
  }
}
