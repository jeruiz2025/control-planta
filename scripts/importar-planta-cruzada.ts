import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { aISO } from "../lib/logica";
import { mkdirSync, writeFileSync } from "node:fs";

const prisma = new PrismaClient();

const RUTA_DEFECTO =
  "C:\\Users\\Administrador\\Downloads\\planta_control_reorganizada_cruzada.xlsx";
const DRY = process.argv.includes("--dry");
const ruta = process.argv.find((a) => a.toLowerCase().endsWith(".xlsx")) ?? RUTA_DEFECTO;

function texto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor === "object") {
    const obj = valor as Record<string, unknown>;
    if ("result" in obj && obj.result !== undefined) return texto(obj.result);
    if ("text" in obj) return String(obj.text);
    if ("richText" in obj) {
      return (obj.richText as { text: string }[]).map((r) => r.text).join("");
    }
    return "";
  }
  return String(valor).trim();
}

/** Limpia comillas residuales del CSV y espacios repetidos. */
function limpiar(valor: unknown): string {
  return texto(valor)
    .replace(/"{2,}$/g, "")
    .replace(/^"+|"+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function soloDigitos(valor: unknown): string {
  return texto(valor).replace(/\D/g, "");
}

/**
 * El acta marca IE (Institución Educativa) o CE (Centro Educativo).
 * Se deduce del nombre; por defecto IE.
 */
function tipoInstitucion(institucion: string): "IE" | "CE" {
  return /CENT(RO)?\s+EDUC/i.test(institucion) ? "CE" : "IE";
}

type FilaPersona = {
  id: number;
  municipio: string;
  institucion: string;
  sede: string;
  grupo: string;
  cargo: string;
  nombre: string;
  cedula: string;
  vinculacion: string;
  fechaNacimiento: string;
  novedadAnterior: string;
  direccion: string;
  telefono: string;
  correo: string;
  nivel: string;
  area: string;
  tipoInstitucion: string;
  autoriza: boolean;
};

async function main() {
  console.log(`Leyendo: ${ruta}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(ruta);
  const ws = wb.getWorksheet("Planta");
  if (!ws) throw new Error("No se encontró la hoja Planta");

  const columnas = new Map<string, number>();
  for (let c = 1; c <= ws.columnCount; c++) {
    const h = texto(ws.getRow(1).getCell(c).value);
    if (h) columnas.set(h, c);
  }
  const val = (fila: ExcelJS.Row, nombre: string): unknown => {
    const c = columnas.get(nombre);
    return c ? fila.getCell(c).value : undefined;
  };
  const requerida = (nombre: string) => {
    if (!columnas.has(nombre)) throw new Error(`Falta la columna "${nombre}" en Planta`);
    return nombre;
  };

  for (const col of [
    "ID",
    "Municipio",
    "Institución",
    "Sede",
    "Grupo",
    "Cargo",
    "Nombre",
    "Cédula",
    "Vinculación",
    "Fecha nacimiento",
  ]) {
    requerida(col);
  }

  const personas: FilaPersona[] = [];
  const descartadas: string[] = [];
  const ids = new Set<number>();

  for (let i = 2; i <= ws.rowCount; i++) {
    const f = ws.getRow(i);
    const id = Number(texto(val(f, "ID")));
    const nombre = limpiar(val(f, "Nombre"));
    if (!Number.isInteger(id) || id <= 0) {
      descartadas.push(`fila ${i}: ID inválido`);
      continue;
    }
    if (!nombre) {
      descartadas.push(`fila ${i}: sin nombre`);
      continue;
    }
    if (ids.has(id)) {
      descartadas.push(`fila ${i}: ID ${id} repetido`);
      continue;
    }
    ids.add(id);

    const institucion = limpiar(val(f, "Institución"));
    const telefonoFijo = soloDigitos(val(f, "TELEFONO"));
    const movil = soloDigitos(val(f, "MOVIL"));

    personas.push({
      id,
      municipio: limpiar(val(f, "Municipio")),
      institucion,
      sede: limpiar(val(f, "Sede")),
      grupo: limpiar(val(f, "Grupo")),
      cargo: limpiar(val(f, "Cargo")),
      nombre,
      cedula: soloDigitos(val(f, "Cédula")),
      vinculacion: limpiar(val(f, "Vinculación")),
      fechaNacimiento: aISO(val(f, "Fecha nacimiento")),
      novedadAnterior: limpiar(val(f, "Novedad (texto anterior)")),
      direccion: limpiar(val(f, "DIRECCION")),
      telefono: telefonoFijo || movil,
      correo: limpiar(val(f, "EMAIL")),
      nivel: limpiar(val(f, "NIVELDICTA")),
      area: limpiar(val(f, "AREAEDUCATIVA")),
      tipoInstitucion: tipoInstitucion(institucion),
      autoriza: true,
    });
  }

  const porGrupo = personas.reduce<Record<string, number>>((acc, p) => {
    acc[p.grupo || "(vacío)"] = (acc[p.grupo || "(vacío)"] ?? 0) + 1;
    return acc;
  }, {});
  const conCorreo = personas.filter((p) => p.correo).length;
  const conTelefono = personas.filter((p) => p.telefono).length;
  const conDireccion = personas.filter((p) => p.direccion).length;

  console.log(`\nPersonas a importar: ${personas.length}`);
  console.log("Por grupo:", JSON.stringify(porGrupo));
  console.log(`Con correo: ${conCorreo} | con teléfono: ${conTelefono} | con dirección: ${conDireccion}`);
  if (descartadas.length) {
    console.log(`Descartadas (${descartadas.length}):`, JSON.stringify(descartadas.slice(0, 10)));
  }
  console.log("\nEjemplos mapeados:");
  for (const p of personas.slice(0, 3)) {
    console.log(JSON.stringify(p));
  }

  const actuales = await prisma.persona.count();
  const novedadesActuales = await prisma.novedad.count();
  console.log(`\nEn la base actual: ${actuales} personas, ${novedadesActuales} novedades.`);

  if (DRY) {
    console.log("\nMODO PRUEBA: no se modificó la base.");
    return;
  }

  if (actuales > 0 || novedadesActuales > 0) {
    const dir = "C:\\Users\\Administrador\\AppData\\Local\\Temp\\opencode";
    mkdirSync(dir, { recursive: true });
    const archivo = `${dir}\\backup-control-planta-${Date.now()}.json`;
    const personasPrevias = await prisma.persona.findMany();
    const novedadesPrevias = await prisma.novedad.findMany();
    writeFileSync(
      archivo,
      JSON.stringify({ personas: personasPrevias, novedades: novedadesPrevias }, null, 2),
      "utf8"
    );
    console.log(`Respaldo guardado en: ${archivo}`);
  }

  const tamano = 500;
  const lotes: FilaPersona[][] = [];
  for (let i = 0; i < personas.length; i += tamano) {
    lotes.push(personas.slice(i, i + tamano));
  }

  await prisma.$transaction([
    prisma.novedad.deleteMany(),
    prisma.persona.deleteMany(),
    ...lotes.map((data) => prisma.persona.createMany({ data })),
  ]);

  const total = await prisma.persona.count();
  const grupos = await prisma.persona.groupBy({
    by: ["grupo"],
    _count: { _all: true },
  });
  console.log(`\nImportación terminada: ${total} personas.`);
  console.log(
    "Grupos en base:",
    JSON.stringify(grupos.map((g) => ({ grupo: g.grupo, total: g._count._all })))
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
