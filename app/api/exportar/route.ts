import { NextRequest } from "next/server";
import { agregadoInstituciones, buscarNovedades, buscarPersonas } from "@/lib/consultas";
import { libroInstituciones, libroNovedades, libroPersonas } from "@/lib/excel";

export const dynamic = "force-dynamic";

function nombreArchivo(tipo: string): string {
  const fecha = new Date().toISOString().slice(0, 10);
  return `planta_${tipo}_${fecha}.xlsx`;
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const tipo = params.tipo ?? "personas";

    let workbook;
    if (tipo === "novedades") {
      const { datos } = await buscarNovedades({ ...params, todo: "1" });
      workbook = libroNovedades(datos);
    } else if (tipo === "instituciones") {
      workbook = libroInstituciones(await agregadoInstituciones());
    } else {
      const { datos } = await buscarPersonas({ ...params, todo: "1" });
      workbook = libroPersonas(datos);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo(tipo)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo generar el archivo" }, { status: 500 });
  }
}
