export type DatosExtra = Record<string, string>;

export type CampoDatosExtra = { clave: string; etiqueta: string };
export type GrupoDatosExtra = { nombre: string; campos: CampoDatosExtra[] };

/**
 * Columnas del Excel que no se guardan en los campos principales de Persona.
 * Se agrupan para mostrarlas ordenadas en la ficha.
 */
export const GRUPOS_DATOS_EXTRA: GrupoDatosExtra[] = [
  {
    nombre: "Documento y datos personales",
    campos: [
      { clave: "FECHAEXPDOCUMENTO", etiqueta: "Fecha de expedición del documento" },
      { clave: "CODCIUDADEXPEDICION", etiqueta: "Código ciudad de expedición" },
      { clave: "CIUDAD.1", etiqueta: "Ciudad de expedición" },
      { clave: "NOMBRE COMPLETO", etiqueta: "Nombre completo (nómina)" },
      { clave: "SEXO", etiqueta: "Sexo" },
      { clave: "CODGENEROEMPLEADO", etiqueta: "Código de género" },
      { clave: "GENEROEMPLEADO", etiqueta: "Género" },
      { clave: "CODESTADOCIVIL", etiqueta: "Código estado civil" },
      { clave: "ESTADOCIVIL", etiqueta: "Estado civil" },
      { clave: "CODCIUDADNACIMIENTO", etiqueta: "Código ciudad de nacimiento" },
      { clave: "CIUDAD.2", etiqueta: "Ciudad de nacimiento" },
      { clave: "GRUPOSANGUINEO", etiqueta: "Grupo sanguíneo" },
      { clave: "CODETNIA", etiqueta: "Código de etnia" },
      { clave: "ETNIA", etiqueta: "Etnia" },
      { clave: "CODPROFESION", etiqueta: "Código de profesión" },
      { clave: "PROFESION", etiqueta: "Profesión" },
      { clave: "CODREGIMENPENSION", etiqueta: "Código régimen pensional" },
      { clave: "REGIMENPENSION", etiqueta: "Régimen pensional" },
      { clave: "CODREGIMENCESANTIA", etiqueta: "Código régimen de cesantías" },
      { clave: "REGIMENCESANTIAS", etiqueta: "Régimen de cesantías" },
    ],
  },
  {
    nombre: "Residencia y contacto",
    campos: [
      { clave: "CODCIUDADRESIDENCIA", etiqueta: "Código ciudad de residencia" },
      { clave: "CIUDAD", etiqueta: "Ciudad de residencia" },
      { clave: "MOVIL", etiqueta: "Teléfono móvil (nómina)" },
      { clave: "TIENECONTACTOEMERGENCIA", etiqueta: "Tiene contacto de emergencia" },
    ],
  },
  {
    nombre: "Datos laborales",
    campos: [
      { clave: "CODSECRETARIA", etiqueta: "Código secretaría" },
      { clave: "CODTIPODOCUMENTO", etiqueta: "Código tipo de documento" },
      { clave: "NUMVINCULACION", etiqueta: "Número de vinculación" },
      { clave: "REFNUMVINCULACION", etiqueta: "Referencia de vinculación" },
      { clave: "FECHAINGRESOEMPRESA", etiqueta: "Fecha de ingreso a la empresa" },
      { clave: "FECHAINGRESONOMINA", etiqueta: "Fecha de ingreso a nómina" },
      { clave: "CODCARGOEMPRESA", etiqueta: "Código de cargo" },
      { clave: "CARGOEMPRESA", etiqueta: "Cargo en nómina" },
      { clave: "GRADO", etiqueta: "Grado" },
      { clave: "BASICO", etiqueta: "Asignación básica" },
      { clave: "CODAREA", etiqueta: "Código de área" },
      { clave: "AREA", etiqueta: "Área (nómina)" },
      { clave: "CODSUCURSAL", etiqueta: "Código de sucursal" },
      { clave: "SUCURSAL", etiqueta: "Sucursal" },
      { clave: "CODESQUEMA", etiqueta: "Código de esquema" },
      { clave: "ESQUEMA", etiqueta: "Esquema" },
      { clave: "CODNIVELCONTRATACION", etiqueta: "Código nivel de contratación" },
      { clave: "NIVELCONTRATACION", etiqueta: "Nivel de contratación" },
      { clave: "CODNIVELDICTA", etiqueta: "Código nivel que dicta" },
      { clave: "CODNIVELEDUCACION", etiqueta: "Código nivel educativo" },
      { clave: "NIVELEDUCACION", etiqueta: "Nivel educativo" },
      { clave: "CODSITUACIONLABORAL", etiqueta: "Código situación laboral" },
      { clave: "SITUACIONLABORAL", etiqueta: "Situación laboral" },
      { clave: "CODAREAEDUCATIVA", etiqueta: "Código área educativa" },
      { clave: "CODAREAEDUCATIVATECNICA", etiqueta: "Código área educativa técnica" },
      { clave: "AREAEDUCATIVATECNICA", etiqueta: "Área educativa técnica" },
      { clave: "OTRAAREAEDUCATIVATECNICA", etiqueta: "Otra área educativa técnica" },
      { clave: "TIPODEPENDENCIA", etiqueta: "Código tipo de dependencia" },
      { clave: "DEPENDENCIATIPO", etiqueta: "Tipo de dependencia" },
      { clave: "CODDEPENDENCIA", etiqueta: "Código de dependencia" },
      { clave: "CODCENTROCOSTO", etiqueta: "Código centro de costo" },
    ],
  },
  {
    nombre: "Encargo",
    campos: [
      { clave: "ENCARGO", etiqueta: "Encargo" },
      { clave: "CODENCARGO", etiqueta: "Código de encargo" },
      { clave: "CARGOEMPRESAENCARGO", etiqueta: "Cargo del encargo" },
      { clave: "BASICOENCARGO", etiqueta: "Básico del encargo" },
      { clave: "GRADOENCARGO", etiqueta: "Grado del encargo" },
      { clave: "TIPODEPENDENCIA_ENCARGO", etiqueta: "Tipo de dependencia del encargo" },
      { clave: "DEPENDENCIATIPO_ENCARGO", etiqueta: "Dependencia del encargo" },
      { clave: "CODDEPENDENCIAENCARGO", etiqueta: "Código dependencia del encargo" },
      { clave: "CODCENTROCOSTOENCARGO", etiqueta: "Código centro de costo del encargo" },
      { clave: "CENTROCOSTOENCARGO", etiqueta: "Centro de costo del encargo" },
    ],
  },
  {
    nombre: "Retiro",
    campos: [
      { clave: "RETIROCONFIRMADO", etiqueta: "Retiro confirmado" },
      { clave: "RETIROFECHA", etiqueta: "Fecha de retiro" },
      { clave: "RETIROFECHALIQ", etiqueta: "Fecha de liquidación" },
    ],
  },
];

export const ETIQUETAS_DATOS_EXTRA: Record<string, string> = Object.fromEntries(
  GRUPOS_DATOS_EXTRA.flatMap((g) => g.campos.map((c) => [c.clave, c.etiqueta]))
);

export const CLAVES_DATOS_EXTRA = new Set(Object.keys(ETIQUETAS_DATOS_EXTRA));

/** Convierte el JSON guardado en base de datos a un objeto seguro. */
export function parseDatosExtra(raw?: string | null): DatosExtra {
  if (!raw) return {};
  try {
    const obj: unknown = JSON.parse(raw);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    const salida: DatosExtra = {};
    for (const [clave, valor] of Object.entries(obj as Record<string, unknown>)) {
      if (valor === null || valor === undefined) continue;
      const texto = String(valor).trim();
      if (texto) salida[clave] = texto;
    }
    return salida;
  } catch {
    return {};
  }
}

export function serializarDatosExtra(datos: DatosExtra): string {
  return JSON.stringify(datos);
}

/** Devuelve los campos del grupo que la persona realmente tiene diligenciados. */
export function camposConValor(
  grupo: GrupoDatosExtra,
  datos: DatosExtra
): CampoDatosExtra[] {
  return grupo.campos.filter((c) => Boolean(datos[c.clave]));
}

/** Campos que vengan en el Excel pero no estén catalogados en los grupos. */
export function camposDesconocidos(datos: DatosExtra): CampoDatosExtra[] {
  return Object.keys(datos)
    .filter((clave) => !CLAVES_DATOS_EXTRA.has(clave))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((clave) => ({ clave, etiqueta: clave }));
}
