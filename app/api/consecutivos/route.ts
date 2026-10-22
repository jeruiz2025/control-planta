import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clave = String(body?.clave ?? "").trim() || "actaPosesion";
    const consecutivo = await prisma.consecutivo.upsert({
      where: { clave },
      create: { clave, valor: 1 },
      update: { valor: { increment: 1 } },
    });
    return Response.json({ clave, valor: consecutivo.valor });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "No se pudo obtener el consecutivo" },
      { status: 500 }
    );
  }
}
