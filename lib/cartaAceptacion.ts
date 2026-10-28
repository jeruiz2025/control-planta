export type DatosCartaAceptacion = {
  numero?: number | null;
  nombre?: string | null;
  cedula?: string | null;
  municipio?: string | null;
  institucion?: string | null;
  cargo?: string | null;
  grupo?: string | null;
  vinculacion?: string | null;
  fechaNacimiento?: string | null;
  datosExtra?: Record<string, string> | null;
  elaboradoPor?: string | null;
  tipo?: "DOCENTE" | "ADMINISTRATIVO" | "OTRO";
};

export type ImagenesCarta = {
  encabezado?: string | null;
  pie?: string | null;
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

function valor(texto?: string | null, relleno = "________________"): string {
  const limpio = (texto ?? "").trim();
  return limpio || relleno;
}

function obtener(extra: Record<string, string>, claves: string[]): string {
  for (const clave of claves) {
    const valorExacto = extra[clave];
    if (valorExacto !== undefined && valorExacto !== null) {
      const limpio = String(valorExacto).trim();
      if (limpio && limpio !== "-" && limpio !== "") return limpio;
    }
  }
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

function firma(texto: string) {
  return {
    stack: [
      { text: "____________________________________", style: "firma" },
      { text: texto, style: "firma" },
    ],
    alignment: "center",
  };
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

export function construirCartaAceptacion(
  datos: DatosCartaAceptacion,
  imagenes: ImagenesCarta = {}
): Record<string, unknown> {
  const extra: Record<string, string> = datos.datosExtra ?? {};
  const nombre = valor(datos.nombre);
  const cedula = valor(datos.cedula);
  const cargo = valor(datos.cargo);
  const institucion = valor(datos.institucion);
  const municipio = valor(datos.municipio);
  const grupo = valor(datos.grupo).toUpperCase();
  const vinculacion = valor(datos.vinculacion).toUpperCase();
  const esDocente =
    datos.tipo === "DOCENTE" ||
    grupo.includes("DOC") ||
    vinculacion.includes("DOC") ||
    cargo.toUpperCase().includes("DOCENTE") ||
    cargo.toUpperCase().includes("MAESTRO") ||
    cargo.toUpperCase().includes("PROFESOR");

  const telefono = obtener(extra, ["TELEFONOMOVIL", "TELEFONO MOVIL", "CELULAR", "TELEFONO"]);
  const correo = obtener(extra, ["CORREO", "EMAIL", "CORREO ELECTRONICO"]);
  const elaboradoPor = valor(datos.elaboradoPor, "________________");
  const fecha = fechaLarga(new Date());

  const contenido: any[] = [
    {
      text: [
        { text: "Pereira, ", bold: false },
        { text: fecha, bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 16],
    },
    {
      text: [
        { text: "Señor (a) : ", bold: false },
        { text: nombre, bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        { text: "Municipio : ", bold: false },
        { text: municipio, bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        { text: "Teléfono celular : ", bold: false },
        { text: valor(telefono), bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        { text: "Correo electrónico : ", bold: false },
        { text: valor(correo), bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 10],
    },
    {
      text: [
        { text: "Autoriza notificación por correo electrónico ", bold: false },
        { text: "SI    ", bold: false },
        { text: "X", bold: true },
        { text: "    NO", bold: false },
        { text: " ____", bold: false },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 14],
    },
    {
      text: "Asunto: Comunicación de Nombramiento",
      style: "parrafo",
      bold: true,
      margin: [0, 0, 0, 14],
    },
    {
      text: [
        "De manera atenta le informo que usted ha sido designado para tomar posesión de su nombramiento como ",
        { text: cargo || (esDocente ? "DOCENTE" : "ADMINISTRATIVO/NUMERARIO"), bold: true },
        ", en la Institución Educativa ",
        { text: institucion, bold: true },
        ", del Municipio de ",
        { text: municipio, bold: true },
        ".",
      ],
      style: "parrafo",
      alignment: "justify",
      margin: [0, 0, 0, 12],
    },
    {
      text: [
        "Por lo anterior le solicito presentarse en la Oficina de Recursos Humanos, ubicada en el Segundo Piso de la Gobernación de Risaralda, con el fin de tomar posesión del cargo.",
      ],
      style: "parrafo",
      alignment: "justify",
      margin: [0, 0, 0, 40],
    },
    {
      text: "Cordialmente,",
      style: "parrafo",
      margin: [0, 0, 0, 60],
    },
    {
      columns: [
        {
          width: "50%",
          stack: [
            { text: elaboradoPor === "________________" ? "____________________________" : elaboradoPor, style: "firma", bold: elaboradoPor !== "________________" },
            { text: "Profesional Universitario RRHH", style: "firma" },
          ],
          alignment: "center",
        },
        {
          width: "50%",
          stack: [
            { text: "____________________________", style: "firma" },
            { text: "Firma del Posesionado", style: "firma" },
            { text: `C. C. No. ${cedula}`, style: "firma", margin: [0, 2, 0, 0] },
          ],
          alignment: "center",
        },
      ],
      columnGap: 40,
      margin: [0, 30, 0, 20],
    },
    {
      text: "Aceptación del Cargo",
      style: "parrafo",
      alignment: "center",
      bold: true,
      margin: [0, 10, 0, 0],
    },
  ];

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
    content: contenido,
    styles: {
      paginaNum: { fontSize: 8 },
      titulo: { fontSize: 14, bold: true },
      parrafo: { fontSize: 11, lineHeight: 1.4 },
      firma: { fontSize: 9 },
    },
    defaultStyle: { fontSize: 11 },
    images: {
      ...(imagenes.encabezado ? { encabezado: imagenes.encabezado } : {}),
      ...(imagenes.pie ? { pie: imagenes.pie } : {}),
    },
    info: {
      title: `Carta de Aceptación del Cargo - ${nombre}`,
      author: "GOBERNACION DE RISARALDA",
    },
  };
}

export async function generarCartaAceptacion(
  datos: DatosCartaAceptacion
): Promise<void> {
  const pdfmakeModule = await import("pdfmake/build/pdfmake");
  const vfsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake: PdfMake =
    (pdfmakeModule as { default?: PdfMake }).default ?? pdfmakeModule;
  const vfs = (vfsModule as { default?: unknown }).default ?? vfsModule;
  pdfMake.addVirtualFileSystem(vfs);

  const [encabezado, pie] = await Promise.all([
    cargarImagen("/EAC.png"),
    cargarImagen("/PAC.png"),
  ]);

  const docDefinition = construirCartaAceptacion(datos, { encabezado, pie });

  const nombreArchivo = `CARTA_ACEPTACION_CARGO_${valor(
    datos.cedula ?? "",
    "sin_cedula"
  )}.pdf`;
  pdfMake.createPdf(docDefinition).download(nombreArchivo);
}
