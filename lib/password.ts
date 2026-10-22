import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const COSTO = 16384;
const BLOQUE = 8;
const PARALELISMO = 1;
const LONGITUD = 64;

export function hashPassword(clave: string): string {
  const sal = randomBytes(16).toString("hex");
  const derivada = scryptSync(clave, sal, LONGITUD, {
    N: COSTO,
    r: BLOQUE,
    p: PARALELISMO,
  }).toString("hex");
  return `scrypt$${COSTO}$${BLOQUE}$${PARALELISMO}$${sal}$${derivada}`;
}

export function verifyPassword(clave: string, almacenado: string): boolean {
  try {
    const [algoritmo, costo, bloque, paralelismo, sal, hash] =
      almacenado.split("$");
    if (algoritmo !== "scrypt" || !sal || !hash) return false;
    const esperado = Buffer.from(hash, "hex");
    const derivada = scryptSync(clave, sal, esperado.length, {
      N: Number(costo),
      r: Number(bloque),
      p: Number(paralelismo),
    });
    return (
      derivada.length === esperado.length && timingSafeEqual(derivada, esperado)
    );
  } catch {
    return false;
  }
}
