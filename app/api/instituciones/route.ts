import { agregadoInstituciones } from "@/lib/consultas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await agregadoInstituciones());
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudieron cargar las instituciones" }, { status: 500 });
  }
}
