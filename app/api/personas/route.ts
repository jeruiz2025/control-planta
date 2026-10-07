import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { aISO } from "@/lib/logica";
import { aPersonaDTO } from "@/lib/serializacion";
import { buscarPersonas } from "@/lib/consultas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const resultado = await buscarPersonas(params);
    return Response.json(resultado);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudieron cargar las personas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nombre = String(body.nombre ?? "").trim();
    if (!nombre) {
      return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    const cedula = String(body.cedula ?? "").trim();
    if (cedula) {
      const duplicada = await prisma.persona.findFirst({ where: { cedula } });
      if (duplicada) {
        return Response.json(
          { error: `Ya existe una persona con la cédula ${cedula}` },
          { status: 409 }
        );
      }
    }
    const maximo = await prisma.persona.aggregate({ _max: { id: true } });
    const id = (maximo._max.id ?? 0) + 1;
    const creada = await prisma.persona.create({
      data: {
        id,
        municipio: String(body.municipio ?? "").trim(),
        institucion: String(body.institucion ?? "").trim(),
        sede: String(body.sede ?? "").trim(),
        grupo: String(body.grupo ?? "").trim(),
        cargo: String(body.cargo ?? "").trim(),
        nombre,
        cedula,
        vinculacion: String(body.vinculacion ?? "").trim(),
        fechaNacimiento: aISO(body.fechaNacimiento),
        novedadAnterior: String(body.novedadAnterior ?? "").trim(),
      },
    });
    return Response.json(aPersonaDTO(creada), { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo crear la persona" }, { status: 500 });
  }
}
