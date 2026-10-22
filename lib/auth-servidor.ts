import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESION, verificarToken, type Sesion } from "@/lib/session";

export type UsuarioSesion = {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
};

export async function sesionActual(): Promise<Sesion | null> {
  const almacen = await cookies();
  return verificarToken(almacen.get(COOKIE_SESION)?.value);
}

export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const sesion = await sesionActual();
  if (!sesion) return null;
  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.sub },
  });
  if (!usuario || !usuario.activo) return null;
  return {
    id: usuario.id,
    usuario: usuario.usuario,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };
}

export async function requiereAdmin(): Promise<UsuarioSesion | null> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "admin") return null;
  return usuario;
}
