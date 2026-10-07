import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";
import { aISO, derivarNovedad } from "../lib/logica";

const prisma = new PrismaClient();

const RUTA_DEFECTO =
  "C:\\Users\\Administrador\\Downloads\\planta_control_reorganizada.xlsx";

function texto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor === "object") {
    const obj = valor as Record<string, unknown>;
    if ("result" in obj && obj.result !== undefined) return texto(obj.result);
    if ("text" in obj) return String(obj.text);
    if ("richText" in obj) {
      const rt = obj.richText as { text: string }[];
      return rt.map((r) => r.text).join("");
    }
    return "";
  }
  return String(valor).trim();
}

function numero(valor: unknown): number | null {
  const t = texto(valor);
  if (!t) return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

function normalizarCedula(valor: unknown): string {
  const t = texto(valor);
  return /^\d+$/.test(t) ? t : "";
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
};

async function main() {
  const ruta = process.argv[2] ?? RUTA_DEFECTO;
  console.log(`Leyendo ${ruta}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(ruta);

  const ws = wb.getWorksheet("Planta");
  if (!ws) throw new Error("No se encontró la hoja Planta");

  const personas: FilaPersona[] = [];
  const sinCedula: string[] = [];
  const duplicadas: string[] = [];
  const vistos = new Map<string, number>();
  for (let i = 2; i <= ws.rowCount; i++) {
    const f = ws.getRow(i);
    const id = numero(f.getCell(1).value);
    const nombre = texto(f.getCell(7).value);
    if (id === null) continue;
    const cedulaCruda = texto(f.getCell(8).value);
    const cedula = normalizarCedula(cedulaCruda);
    if (cedulaCruda && !cedula) {
      sinCedula.push(`id ${id}: "${cedulaCruda}"`);
    }
    const fila: FilaPersona = {
      id,
      municipio: texto(f.getCell(2).value),
      institucion: texto(f.getCell(3).value),
      sede: texto(f.getCell(4).value),
      grupo: texto(f.getCell(5).value),
      cargo: texto(f.getCell(6).value),
      nombre,
      cedula,
      vinculacion: texto(f.getCell(9).value),
      fechaNacimiento: aISO(f.getCell(10).value),
      novedadAnterior: texto(f.getCell(13).value),
    };
    const clave = [
      fila.municipio,
      fila.institucion,
      fila.sede,
      fila.grupo,
      fila.cargo,
      fila.nombre,
      fila.cedula,
      fila.vinculacion,
      fila.fechaNacimiento,
      fila.novedadAnterior.replace(/\s+/g, " ").trim(),
    ].join("|");
    const previa = vistos.get(clave);
    if (previa !== undefined) {
      duplicadas.push(`id ${id} (idéntica a id ${previa})`);
      continue;
    }
    vistos.set(clave, id);
    personas.push(fila);
  }

  const porCedula = new Map<string, number>();
  for (const p of personas) {
    if (p.cedula && !porCedula.has(p.cedula)) porCedula.set(p.cedula, p.id);
  }

  const nov = wb.getWorksheet("Novedades");
  const novedades = [];
  const ignoradas: string[] = [];
  if (nov) {
    for (let i = 2; i <= nov.rowCount; i++) {
      const f = nov.getRow(i);
      const fechaRegistro = aISO(f.getCell(1).value);
      const cedula = texto(f.getCell(2).value);
      const tipo = texto(f.getCell(7).value);
      const observacion = texto(f.getCell(14).value);
      if (!cedula && !tipo) continue;
      if (/EJEMPLO/i.test(observacion)) {
        ignoradas.push(`fila ${i}: fila de ejemplo`);
        continue;
      }
      const personaId = porCedula.get(cedula);
      if (!personaId) {
        ignoradas.push(`fila ${i}: cédula ${cedula} sin persona en Planta`);
        continue;
      }
      const desde = aISO(f.getCell(8).value) || null;
      const hasta = aISO(f.getCell(9).value) || null;
      const estado = texto(f.getCell(12).value) || "Pendiente";
      novedades.push({
        personaId,
        fechaRegistro: fechaRegistro || aISO(new Date()),
        tipo,
        desde,
        hasta,
        estado,
        observacion,
        ...derivarNovedad({ tipo, desde, hasta, estado }),
      });
    }
  }

  console.log(
    `Planta: ${personas.length} personas · Novedades: ${novedades.length}`
  );
  if (sinCedula.length > 0) {
    console.log(
      `Cédulas no numéricas vaciadas (${sinCedula.length}) — original en el Excel:`
    );
    sinCedula.forEach((x) => console.log(`  - ${x}`));
  }
  if (duplicadas.length > 0) {
    console.log(`Filas duplicadas ignoradas (${duplicadas.length}):`);
    duplicadas.forEach((x) => console.log(`  - ${x}`));
  }

  await prisma.$transaction([
    prisma.novedad.deleteMany(),
    prisma.persona.deleteMany(),
  ]);

  const tamano = 500;
  for (let i = 0; i < personas.length; i += tamano) {
    await prisma.persona.createMany({ data: personas.slice(i, i + tamano) });
  }
  if (novedades.length > 0) {
    await prisma.novedad.createMany({ data: novedades });
  }

  const total = await prisma.persona.count();
  console.log(`Importadas ${total} personas y ${novedades.length} novedades.`);
  if (ignoradas.length > 0) {
    console.log(`Novedades ignoradas (${ignoradas.length}):`);
    ignoradas.forEach((x) => console.log(`  - ${x}`));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
