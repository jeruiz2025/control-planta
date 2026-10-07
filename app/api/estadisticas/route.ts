import { calcularEstadisticas } from "@/lib/consultas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await calcularEstadisticas());
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudieron calcular las estadísticas" }, { status: 500 });
  }
}
