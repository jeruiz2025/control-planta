import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  COOKIE_SESION,
  DURACION_SESION_SEG,
  crearToken,
  opcionesCookie,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const usuario = String(body?.usuario ?? "").trim();
  const clave = String(body?.clave ?? "");

  if (!usuario || !clave) {
    return NextResponse.json(
      { error: "Usuario y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const encontrado = await prisma.usuario.findUnique({
      where: { usuario },
    });

    if (
      !encontrado ||
      !encontrado.activo ||
      !verifyPassword(clave, encontrado.hash)
    ) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const exp = Math.floor(Date.now() / 1000) + DURACION_SESION_SEG;
    const token = crearToken({
      sub: encontrado.id,
      usuario: encontrado.usuario,
      rol: encontrado.rol,
      exp,
    });

    const res = NextResponse.json({
      ok: true,
      usuario: {
        usuario: encontrado.usuario,
        nombre: encontrado.nombre,
        rol: encontrado.rol,
      },
    });
    res.cookies.set(
      COOKIE_SESION,
      token,
      opcionesCookie(DURACION_SESION_SEG)
    );
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }
}
