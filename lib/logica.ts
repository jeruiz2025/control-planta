import { DIAS_MINIMO_REEMPLAZO, TIPOS_NOVEDAD } from "./constantes";

export function aISO(fecha: unknown): string {
  if (!fecha) return "";
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  if (typeof fecha === "string") return fecha.trim().slice(0, 10);
  return "";
}

function medianocheLocal(fecha: Date): number {
  return Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function calcularEdad(
  fechaNacimiento: string,
  hoy: Date = new Date()
): number | null {
  if (!fechaNacimiento) return null;
  const inicio = Date.parse(`${fechaNacimiento.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(inicio)) return null;
  const dias = (medianocheLocal(hoy) - inicio) / 86400000;
  if (dias < 0) return null;
  return Math.round((dias / 365.25) * 10) / 10;
}

export function alertaDeEdad(edad: number | null): string {
  if (edad === null) return "";
  if (edad >= 65) return "Verificar retiro forzoso";
  if (edad >= 64) return "Cumple 65 en menos de 1 año";
  return "";
}

export function claseDeTipo(tipo: string): string {
  return TIPOS_NOVEDAD[tipo] ?? "";
}

export function calcularDias(desde?: string | null, hasta?: string | null): number | null {
  if (!desde || !hasta) return null;
  const a = Date.parse(`${desde.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${hasta.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000) + 1;
}

export function calcularNecesidad(
  clase: string,
  dias: number | null,
  desde?: string | null,
  hasta?: string | null
): string {
  if (clase === "d") return "Cubrir vacante definitiva";
  if (clase === "t") {
    if (dias === null || !desde || !hasta) return "Falta la fecha Hasta";
    return dias >= DIAS_MINIMO_REEMPLAZO
      ? "Reemplazo temporal"
      : "Sin reemplazo (periodo corto)";
  }
  if (clase === "m") return "Revisar plaza de origen y destino";
  if (clase === "e") return "Cubrir plaza de origen";
  if (clase === "v") return "Prorrogar o liberar";
  return "";
}

export function calcularRequiereAccion(necesidad: string, estado: string): boolean {
  if (!necesidad) return false;
  if (necesidad.startsWith("Sin")) return false;
  if (necesidad === "Falta la fecha Hasta") return false;
  if (estado === "Cubierta" || estado === "No requiere") return false;
  return true;
}

export function derivarNovedad(entrada: {
  tipo: string;
  desde?: string | null;
  hasta?: string | null;
  estado: string;
}) {
  const clase = claseDeTipo(entrada.tipo);
  const dias = calcularDias(entrada.desde, entrada.hasta);
  const necesidad = calcularNecesidad(clase, dias, entrada.desde, entrada.hasta);
  const requiereAccion = calcularRequiereAccion(necesidad, entrada.estado);
  return { clase, dias, necesidad, requiereAccion };
}
