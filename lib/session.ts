import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESION = "cp_sesion";
export const DURACION_SESION_SEG = 60 * 60 * 8;

export type Sesion = {
  sub: number;
  usuario: string;
  rol: string;
  exp: number;
};

function secreto(): string {
  return process.env.AUTH_SECRET ?? "control-planta-secreto-desarrollo";
}

export function crearToken(sesion: Sesion): string {
  const cuerpo = Buffer.from(JSON.stringify(sesion)).toString("base64url");
  const firma = createHmac("sha256", secreto())
    .update(cuerpo)
    .digest("base64url");
  return `${cuerpo}.${firma}`;
}

export function verificarToken(token: string | undefined | null): Sesion | null {
  if (!token) return null;
  const [cuerpo, firma] = token.split(".");
  if (!cuerpo || !firma) return null;

  const esperada = createHmac("sha256", secreto())
    .update(cuerpo)
    .digest("base64url");
  const recibida = Buffer.from(firma);
  const calculada = Buffer.from(esperada);
  if (
    recibida.length !== calculada.length ||
    !timingSafeEqual(recibida, calculada)
  ) {
    return null;
  }

  try {
    const sesion = JSON.parse(
      Buffer.from(cuerpo, "base64url").toString("utf8")
    ) as Sesion;
    if (!sesion?.exp || sesion.exp < Math.floor(Date.now() / 1000)) return null;
    return sesion;
  } catch {
    return null;
  }
}

export function opcionesCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}
