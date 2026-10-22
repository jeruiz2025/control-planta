import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereAdmin } from "@/lib/auth-servidor";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "usuario"];
const SIN_HASH = {
  id: true,
  usuario: true,
  nombre: true,
  rol: true,
  activo: true,
  createdAt: true,
} as const;

export async function GET() {
  if (!(await requiereAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const usuarios = await prisma.usuario.findMany({
    orderBy: { usuario: "asc" },
    select: SIN_HASH,
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  if (!(await requiereAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const usuario = String(body?.usuario ?? "").trim();
  const nombre = String(body?.nombre ?? "").trim();
  const clave = String(body?.clave ?? "");
  const rol = String(body?.rol ?? "usuario");

  if (usuario.length < 3) {
    return NextResponse.json(
      { error: "El usuario debe tener al menos 3 caracteres" },
      { status: 400 }
    );
  }
  if (clave.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }
  if (!ROLES.includes(rol)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
  }

  try {
    const creado = await prisma.usuario.create({
      data: { usuario, nombre, hash: hashPassword(clave), rol },
      select: SIN_HASH,
    });
    return NextResponse.json(creado, { status: 201 });
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese nombre" },
        { status: 409 }
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo crear el usuario" },
      { status: 500 }
    );
  }
}
