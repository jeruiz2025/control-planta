export type DatosActaPosesion = {
  numero?: number | null;
  nombre?: string | null;
  cedula?: string | null;
  municipio?: string | null;
  institucion?: string | null;
  cargo?: string | null;
  fechaNacimiento?: string | null;
  datosExtra?: Record<string, string> | null;
  elaboradoPor?: string | null;
};

export type ImagenesActa = {
  encabezado?: string | null;
  pie?: string | null;
};

/**
 * Textos fijos del acta. Si cambia la resolución del encargo o el valor de la
 * estampilla, se ajustan aquí.
 */
export const CONFIG_ACTA = {
  ciudadExpedicion: "Pereira",
  dependencia: "Secretaría de Educación Departamental",
  resolucionNumero: "00120",
  resolucionFecha: "06 DE ENERO DE 2026",
  regimenPrestacional: "FONDO DE PRESTACIONES SOCIALES DEL MAGISTERIO",
  valorEstampilla: 43000,
};

type PdfMake = {
  addVirtualFileSystem: (vfs: unknown) => void;
  createPdf: (def: unknown) => { download: (nombre: string) => void };
};

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MARGEN_LATERAL = 70;
const ANCHO_CONTENIDO = 455;

function fechaLarga(fecha: Date): string {
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/** Convierte "1994-05-29" en "29 de mayo de 1994" sin problemas de zona horaria. */
function fechaDesdeISO(iso?: string | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((iso ?? "").trim());
  if (!match) return (iso ?? "").trim();
  const [, anio, mes, dia] = match;
  const indice = Number(mes) - 1;
  if (indice < 0 || indice > 11) return (iso ?? "").trim();
  return `${Number(dia)} de ${MESES[indice]} de ${anio}`;
}

function valor(texto?: string | null, relleno = "________________"): string {
  const limpio = (texto ?? "").trim();
  return limpio || relleno;
}

function capitalizar(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function dinero(valorNumerico?: string | null): string {
  const limpio = (valorNumerico ?? "").replace(/[^\d]/g, "");
  const numero = Number(limpio);
  if (!limpio || Number.isNaN(numero) || numero <= 0) return "________________";
  return new Intl.NumberFormat("es-CO").format(numero);
}

/** Toma el primer valor con contenido: el del encargo o, si no hay, el básico. */
function obtener(extra: Record<string, string>, claves: string[]): string {
  for (const clave of claves) {
    const valorExacto = extra[clave];
    if (valorExacto !== undefined && valorExacto !== null) {
      const limpio = String(valorExacto).trim();
      if (limpio && limpio !== "-" && limpio !== "") return limpio;
    }
  }

  // Intentar por coincidencia insensible a mayúsculas/minúsculas, espacios, puntos, guiones
  const mapa = new Map<string, string>();
  for (const [clave, valor] of Object.entries(extra)) {
    const limpio = String(valor).trim();
    if (!limpio || limpio === "-" || limpio === "") continue;
    const normalizada = clave
      .toUpperCase()
      .replace(/\./g, " ")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!mapa.has(normalizada)) {
      mapa.set(normalizada, limpio);
    }
  }

  for (const clave of claves) {
    const normalizada = clave
      .toUpperCase()
      .replace(/\./g, " ")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (mapa.has(normalizada)) {
      const valor = mapa.get(normalizada)!;
      if (valor && valor !== "0") return valor;
    }
  }

  return "";
}

function primeroConValor(extra: Record<string, string>, claves: string[]): string {
  const dato = obtener(extra, claves);
  if (dato && dato !== "0") return dato;
  return "";
}

async function cargarImagen(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function firma(texto: string) {
  return {
    stack: [
      { text: "____________________________________", style: "firma" },
      { text: texto, style: "firma" },
    ],
    alignment: "center",
  };
}

/**
 * Construye la definición del PDF. Se separa de la descarga para poder
 * inspeccionar el documento en pruebas locales.
 */
export function construirActaPosesion(
  datos: DatosActaPosesion,
  imagenes: ImagenesActa = {}
): Record<string, unknown> {
  const extra: Record<string, string> = datos.datosExtra ?? {};

  const numeroActa = datos.numero
    ? String(datos.numero).padStart(3, "0")
    : "____";
  const nombre = valor(datos.nombre);
  const cedula = valor(datos.cedula);
  const ciudadExpedicion = obtener(extra, [
    "CIUDAD.1",
    "CIUDAD 1",
    "CIUDADEXPEDICION",
    "CIUDAD DE EXPEDICION",
    "LUGAR EXPEDICION",
    "CIUDAD EXPEDICION",
  ]);
  const fechaExpedicion = valor(fechaDesdeISO(obtener(extra, ["FECHAEXPDOCUMENTO", "FECHA EXPEDICION", "FECHAEXP", "FECHA EXPEDIDA"])));
  const grupoSanguineo = obtener(extra, ["GRUPOSANGUINEO", "GRUPO SANGUINEO", "GRUPO SANGUÍNEO", "GS RH", "RH", "FACTOR RH"]);
  const ciudadNacimiento = obtener(extra, ["CIUDAD.2", "CIUDAD 2", "CIUDADNACIMIENTO", "CIUDAD DE NACIMIENTO", "LUGAR NACIMIENTO"]);
  const fechaNacimiento = valor(fechaDesdeISO(datos.fechaNacimiento));
  const cargo = valor(datos.cargo);
  const institucion = valor(datos.institucion);
  const municipio = valor(datos.municipio);
  const profesion = valor(capitalizar(obtener(extra, ["PROFESION", "PROFESIÓN", "TITULO", "TITULOS", "TITULO PROFESIONAL"]).trim()));
  const estadoCivil = obtener(extra, ["ESTADOCIVIL", "ESTADO CIVIL", "ESTADOCIV", "EST CIVIL"]);
  const basico = dinero(
    primeroConValor(extra, ["BASICOENCARGO", "BASICO", "BÁSICO", "SUELDO", "ASIGNACION BASICA", "ASIGNACIÓN BÁSICA"])
  );
  const grado = valor(primeroConValor(extra, ["GRADOENCARGO", "GRADO"]));

  const estampilla = new Intl.NumberFormat("es-CO").format(
    CONFIG_ACTA.valorEstampilla
  );
  const elaboradoPor = valor(datos.elaboradoPor, "________________");

  return {
    pageSize: "A4",
    pageMargins: [MARGEN_LATERAL, 130, MARGEN_LATERAL, 90],
    header: (currentPage: number) => ({
      stack: [
        {
          text: `Página ${currentPage}`,
          alignment: "right",
          style: "paginaNum",
          margin: [0, 0, 0, 4],
        },
        ...(imagenes.encabezado
          ? [
              {
                image: "encabezado",
                width: ANCHO_CONTENIDO,
                alignment: "center",
              },
            ]
          : []),
      ],
      margin: [MARGEN_LATERAL, 10, MARGEN_LATERAL, 0],
    }),
    footer: () =>
      imagenes.pie
        ? {
            image: "pie",
            width: ANCHO_CONTENIDO,
            alignment: "center",
            margin: [MARGEN_LATERAL, 15, MARGEN_LATERAL, 5],
          }
        : { text: "" },
    content: [
      {
        text: `ACTA DE POSESIÓN N° ${numeroActa}`,
        style: "titulo",
        alignment: "center",
        margin: [0, 0, 0, 18],
      },
      {
        text: [
          `En la ciudad de ${CONFIG_ACTA.ciudadExpedicion} el día: `,
          { text: fechaLarga(new Date()), bold: true },
        ],
        style: "parrafo",
        margin: [0, 0, 0, 12],
      },
      {
        text: `Se presentó en el Despacho de la ${CONFIG_ACTA.dependencia}`,
        style: "parrafo",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "El (la) señor (a): ",
          { text: nombre, bold: true },
        ],
        style: "parrafo",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Identificado(a) con cédula de ciudadanía No. ",
          { text: cedula, bold: true },
          " DE ",
          { text: ciudadExpedicion, bold: true },
          " EXPEDIDA EL ",
          { text: fechaExpedicion, bold: true },
          ".  G.S. RH: ",
          { text: grupoSanguineo, bold: true },
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Nacido (a) en el Municipio de: ",
          { text: ciudadNacimiento, bold: true },
          " - EL ",
          { text: fechaNacimiento, bold: true },
          ".",
        ],
        style: "parrafo",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Con el fin de tomar posesión del cargo de: ",
          { text: cargo, bold: true },
          ", EN LA INSTITUCIÓN EDUCATIVA ",
          { text: institucion, bold: true },
          ", DEL MUNICIPIO DE ",
          { text: municipio, bold: true },
          ", HASTA QUE SE PROVEA EL CARGO POR CONCURSO DE MÉRITOS.",
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Título(s): ",
          { text: profesion, bold: true },
          ".",
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Con una asignación mensual de: $ ",
          { text: basico, bold: true },
          "     GRADO ",
          { text: grado, bold: true },
        ],
        style: "parrafo",
        margin: [0, 0, 0, 10],
      },
      {
        text: [
          "ESTADO CIVIL: ",
          { text: estadoCivil, bold: true },
        ],
        style: "parrafo",
        margin: [0, 0, 0, 6],
      },
      {
        text: `Para el cual se nombró en: EN ENCARGO según RESOLUCIÓN Nº ${CONFIG_ACTA.resolucionNumero} DEL ${CONFIG_ACTA.resolucionFecha}.`,
        style: "parrafo",
        margin: [0, 0, 0, 4],
      },
      {
        text: `Régimen Prestacional: ${CONFIG_ACTA.regimenPrestacional}.`,
        style: "parrafo",
        margin: [0, 0, 0, 14],
      },
      {
        text: [
          "Valor Estampilla Pro-Desarrollo: ",
          { text: `$ ${estampilla}`, bold: true },
        ],
        style: "parrafo",
        margin: [0, 0, 0, 46],
      },
      {
        columns: [
          {
            width: "50%",
            stack: [
              firma("Firma del Posesionado"),
              {
                text: `Cédula No. ${datos.cedula ? datos.cedula : "________________"}`,
                style: "firma",
                alignment: "center",
                margin: [0, 2, 0, 0],
              },
            ],
          },
          {
            width: "50%",
            ...firma("Secretaria de Educación"),
          },
        ],
        columnGap: 30,
        margin: [0, 0, 0, 34],
      },
      {
        columns: [
          {
            width: "50%",
            ...firma("Directora Administrativa y del Talento Humano"),
          },
          {
            width: "50%",
            ...firma("Vo. Bo. Recursos Humanos"),
          },
        ],
        columnGap: 30,
        margin: [0, 0, 0, 34],
      },
      {
        text: [
          { text: "Elaboró: ", bold: true },
          { text: elaboradoPor },
        ],
        style: "parrafo",
      },
    ],
    styles: {
      paginaNum: { fontSize: 8 },
      titulo: { fontSize: 13, bold: true },
      parrafo: { fontSize: 10, lineHeight: 1.25 },
      firma: { fontSize: 9, bold: false },
    },
    defaultStyle: { fontSize: 10 },
    images: {
      ...(imagenes.encabezado ? { encabezado: imagenes.encabezado } : {}),
      ...(imagenes.pie ? { pie: imagenes.pie } : {}),
    },
    info: {
      title: `Acta de posesión - ${nombre}`,
      author: "GOBERNACION DE RISARALDA",
    },
  };
}

export async function generarActaPosesion(
  datos: DatosActaPosesion
): Promise<void> {
  const pdfmakeModule = await import("pdfmake/build/pdfmake");
  const vfsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake: PdfMake =
    (pdfmakeModule as { default?: PdfMake }).default ?? pdfmakeModule;
  const vfs = (vfsModule as { default?: unknown }).default ?? vfsModule;
  pdfMake.addVirtualFileSystem(vfs);

  const [encabezado, pie] = await Promise.all([
    cargarImagen("/EAP.png"),
    cargarImagen("/PAP.png"),
  ]);

  const docDefinition = construirActaPosesion(datos, { encabezado, pie });

  const numeroTxt = datos.numero
    ? String(datos.numero).padStart(3, "0")
    : "SIN_NUMERO";
  const nombreArchivo = `ACTA_POSESION_${numeroTxt}_${valor(
    datos.cedula ?? "",
    "sin_cedula"
  )}.pdf`;
  pdfMake.createPdf(docDefinition).download(nombreArchivo);
}
