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

/**
 * Columnas que ya se guardan en campos propios de Persona o que son
 * duplicados/derivados del Excel y no aportan información nueva.
 */
const COLUMNAS_EXCLUIDAS = new Set([
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
  "Novedad (texto anterior)",
  "DIRECCION",
  "TELEFONO",
  "EMAIL",
  "NIVELDICTA",
  "AREAEDUCATIVA",
  // Duplicados o cálculos del Excel
  "FECHAEXP",
  "CIUDADEXP",
  "FECHANACIMIENTO",
  "CEDULA",
  "EDAD",
  "Edad",
  "Alerta de edad",
  "INSTITUCION",
]);

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
  datosExtra: string;
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
  const extra = (fila: ExcelJS.Row): Record<string, string> => {
    const datos: Record<string, string> = {};
    for (const [nombre, c] of columnas) {
      if (COLUMNAS_EXCLUIDAS.has(nombre) || nombre.startsWith("Unnamed")) continue;
      const contenido = limpiar(fila.getCell(c).value);
      if (contenido) datos[nombre] = contenido;
    }
    return datos;
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
      datosExtra: JSON.stringify(extra(f)),
    });
  }

  const porGrupo = personas.reduce<Record<string, number>>((acc, p) => {
    acc[p.grupo || "(vacío)"] = (acc[p.grupo || "(vacío)"] ?? 0) + 1;
    return acc;
  }, {});
  const conCorreo = personas.filter((p) => p.correo).length;
  const conTelefono = personas.filter((p) => p.telefono).length;
  const conDireccion = personas.filter((p) => p.direccion).length;
  const camposExtra = new Set<string>();
  let totalCamposExtra = 0;
  for (const p of personas) {
    const datos = JSON.parse(p.datosExtra) as Record<string, string>;
    totalCamposExtra += Object.keys(datos).length;
    for (const clave of Object.keys(datos)) camposExtra.add(clave);
  }

  console.log(`\nPersonas a importar: ${personas.length}`);
  console.log("Por grupo:", JSON.stringify(porGrupo));
  console.log(`Con correo: ${conCorreo} | con teléfono: ${conTelefono} | con dirección: ${conDireccion}`);
  console.log(
    `Datos completos: ${camposExtra.size} columnas distintas | ${
      Math.round((totalCamposExtra / personas.length) * 10) / 10
    } campos diligenciados por persona`
  );
  if (descartadas.length) {
    console.log(`Descartadas (${descartadas.length}):`, JSON.stringify(descartadas.slice(0, 10)));
  }
  console.log("\nEjemplos mapeados:");
  for (const p of personas.slice(0, 2)) {
    const { datosExtra, ...resto } = p;
    console.log(JSON.stringify({ ...resto, datosExtra: JSON.parse(datosExtra) }));
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
