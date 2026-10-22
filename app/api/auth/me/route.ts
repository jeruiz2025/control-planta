import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth-servidor";

export const dynamic = "force-dynamic";

export async function GET() {
  const usuario = await usuarioActual();
  return NextResponse.json({ usuario });
}
