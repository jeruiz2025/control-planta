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

type Contexto = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Contexto) {
  const admin = await requiereAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const nombre = body?.nombre !== undefined ? String(body.nombre).trim() : undefined;
  const rol = body?.rol !== undefined ? String(body.rol) : undefined;
  const activo = body?.activo !== undefined ? Boolean(body.activo) : undefined;
  const clave = body?.clave !== undefined ? String(body.clave) : undefined;

  if (rol !== undefined && !ROLES.includes(rol)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
  }
  if (clave !== undefined && clave !== "" && clave.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }
  if (id === admin.id && (activo === false || (rol !== undefined && rol !== "admin"))) {
    return NextResponse.json(
      { error: "No puedes desactivar ni quitar el rol admin a tu propio usuario" },
      { status: 400 }
    );
  }

  try {
    const actualizado = await prisma.usuario.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(rol !== undefined ? { rol } : {}),
        ...(activo !== undefined ? { activo } : {}),
        ...(clave ? { hash: hashPassword(clave) } : {}),
      },
      select: SIN_HASH,
    });
    return NextResponse.json(actualizado);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo actualizar el usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Contexto) {
  const admin = await requiereAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
  }
  if (id === admin.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propio usuario" },
      { status: 400 }
    );
  }

  try {
    const objetivo = await prisma.usuario.findUnique({ where: { id } });
    if (!objetivo) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    if (objetivo.rol === "admin" && objetivo.activo) {
      const admins = await prisma.usuario.count({
        where: { rol: "admin", activo: true },
      });
      if (admins <= 1) {
        return NextResponse.json(
          { error: "Debe quedar al menos un administrador activo" },
          { status: 400 }
        );
      }
    }
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo eliminar el usuario" },
      { status: 500 }
    );
  }
}
