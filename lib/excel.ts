import ExcelJS from "exceljs";
import type { InstitucionDTO, NovedadDTO, PersonaDTO } from "./types";

function preparar(hoja: ExcelJS.Worksheet, encabezados: string[], anchos: number[]) {
  encabezados.forEach((titulo, i) => {
    const celda = hoja.getCell(1, i + 1);
    celda.value = titulo;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D4ED8" },
    };
    celda.alignment = { vertical: "middle" };
    hoja.getColumn(i + 1).width = anchos[i] ?? 18;
  });
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: encabezados.length },
  };
}

export function libroPersonas(datos: PersonaDTO[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Control de planta";
  const hoja = wb.addWorksheet("Planta");
  preparar(
    hoja,
    [
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
      "Edad",
      "Alerta de edad",
      "Novedades",
      "Novedad (texto anterior)",
    ],
    [6, 16, 34, 34, 16, 26, 40, 14, 24, 16, 8, 30, 10, 34]
  );
  datos.forEach((p, i) => {
    hoja.addRow([
      p.id,
      p.municipio,
      p.institucion,
      p.sede,
      p.grupo,
      p.cargo,
      p.nombre,
      p.cedula,
      p.vinculacion,
      p.fechaNacimiento,
      p.edad,
      p.alerta,
      p._count?.novedades ?? 0,
      p.novedadAnterior,
    ]);
    hoja.getRow(i + 2).alignment = { vertical: "top" };
  });
  return wb;
}

export function libroNovedades(datos: NovedadDTO[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Control de planta";
  const hoja = wb.addWorksheet("Novedades");
  preparar(
    hoja,
    [
      "Fecha de registro",
      "Cédula",
      "Nombre",
      "Municipio",
      "Institución",
      "Cargo",
      "Tipo de novedad",
      "Clase",
      "Desde",
      "Hasta",
      "Días",
      "Necesidad detectada",
      "Estado del trámite",
      "¿Requiere acción?",
      "Observación",
    ],
    [16, 14, 40, 16, 34, 24, 26, 10, 14, 14, 8, 32, 16, 16, 40]
  );
  datos.forEach((n) => {
    hoja.addRow([
      n.fechaRegistro,
      n.persona?.cedula ?? "",
      n.persona?.nombre ?? "",
      n.persona?.municipio ?? "",
      n.persona?.institucion ?? "",
      n.persona?.cargo ?? "",
      n.tipo,
      n.clase,
      n.desde ?? "",
      n.hasta ?? "",
      n.dias,
      n.necesidad,
      n.estado,
      n.requiereAccion ? "SÍ" : "",
      n.observacion,
    ]);
  });
  return wb;
}

export function libroInstituciones(datos: InstitucionDTO[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Control de planta";
  const hoja = wb.addWorksheet("Instituciones");
  preparar(
    hoja,
    [
      "Municipio",
      "Institución",
      "Docentes",
      "Directivos",
      "Administrativos",
      "Total",
      "Propiedad",
      "Prov. vacante definitiva",
      "Prov. vacante temporal",
      "Temporal / PTA",
      "Otros",
      "Novedades por atender",
      "Personas de 65 años o más",
    ],
    [16, 36, 12, 12, 16, 10, 12, 24, 22, 16, 10, 22, 26]
  );
  datos.forEach((i) => {
    hoja.addRow([
      i.municipio,
      i.institucion,
      i.docentes,
      i.directivos,
      i.administrativos,
      i.total,
      i.propiedad,
      i.provDefinitiva,
      i.provTemporal,
      i.temporalPTA,
      i.otros,
      i.novedadesPorAtender,
      i.mayores65,
    ]);
  });
  return wb;
}
