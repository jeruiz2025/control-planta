export type DatosActaPosesion = {
  numero?: number | null;
  nombre?: string | null;
  cedula?: string | null;
  direccion?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  correo?: string | null;
  autoriza?: boolean | null;
  cargo?: string | null;
  nivel?: string | null;
  area?: string | null;
  tipoInstitucion?: "IE" | "CE" | null;
  institucion?: string | null;
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

const MARGEN_LATERAL = 85;
const MARGEN_SUPERIOR = 130;
const ANCHO_CONTENIDO = 425;

function fechaLarga(fecha: Date): string {
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

function valor(texto: string, relleno = "________"): string {
  const limpio = (texto ?? "").trim();
  return limpio || relleno;
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

const COLUMNAS = [
  "________________________________",
  "________________________________",
];

export async function generarActaPosesion(
  datos: DatosActaPosesion
): Promise<void> {
  const pdfmakeModule = await import("pdfmake/build/pdfmake");
  const vfsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake: PdfMake =
    (pdfmakeModule as { default?: PdfMake }).default ?? pdfmakeModule;
  const vfs = (vfsModule as { default?: unknown }).default ?? vfsModule;
  pdfMake.addVirtualFileSystem(vfs);

  const [encabImage, pieImage] = await Promise.all([
    cargarImagen("/EAP.png"),
    cargarImagen("/PAP.png"),
  ]);

  const marcaIE = datos.tipoInstitucion === "IE" ? "X" : " ";
  const marcaCE = datos.tipoInstitucion === "CE" ? "X" : " ";

  const docDefinition: Record<string, unknown> = {
    pageSize: "A4",
    pageMargins: [MARGEN_LATERAL, MARGEN_SUPERIOR, MARGEN_LATERAL, 100],
    header: (currentPage: number) => ({
      stack: [
        {
          text: `Página ${currentPage}`,
          alignment: "right",
          style: "paginaNum",
          margin: [0, 0, 0, 4],
        },
        ...(encabImage
          ? [{ image: "encabImage", width: ANCHO_CONTENIDO, alignment: "center" }]
          : []),
      ],
      margin: [MARGEN_LATERAL, 10, MARGEN_LATERAL, 0],
    }),
    footer: () =>
      pieImage
        ? {
            image: "pieImage",
            width: ANCHO_CONTENIDO,
            alignment: "center",
            margin: [MARGEN_LATERAL, 15, MARGEN_LATERAL, 5],
          }
        : { text: "" },
    content: [
      {
        text: `Pereira, ${fechaLarga(new Date())}`,
        style: "campo",
        margin: [0, 0, 0, 16],
      },
      {
        text: `ACTA DE POSESIÓN N° ${
          datos.numero ? String(datos.numero).padStart(3, "0") : "____"
        }`,
        style: "tituloActa",
        alignment: "center",
        margin: [0, 0, 0, 18],
      },
      {
        text: `Señor(a): ${valor(datos.nombre ?? "")}`,
        style: "destinatario",
        margin: [0, 0, 0, 8],
      },
      {
        text: `Dirección: ${valor(datos.direccion ?? "")}`,
        style: "campo",
        margin: [0, 0, 0, 2],
      },
      {
        text: `Municipio: ${valor(datos.municipio ?? "")}     Teléfono celular: ${valor(
          datos.telefono ?? ""
        )}`,
        style: "campo",
        margin: [0, 0, 0, 2],
      },
      {
        text: `Correo electrónico: ${valor(datos.correo ?? "")}`,
        style: "campo",
        margin: [0, 0, 0, 2],
      },
      {
        text: `Autoriza notificación por correo electrónico     SI ${
          (datos.autoriza ?? true) ? "__X__" : "_____"
        }     NO ${(datos.autoriza ?? true) ? "_____" : "__X__"}`,
        style: "campo",
        margin: [0, 0, 0, 18],
      },
      {
        text: "Asunto: Comunicación de Nombramiento",
        style: "asunto",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "De manera atenta le informo que usted ha sido designado para tomar posesión de su nombramiento como, ",
          { text: valor(datos.cargo ?? ""), bold: true },
          ", en el nivel de ",
          { text: valor(datos.nivel ?? ""), bold: true },
          ", área de ",
          { text: valor(datos.area ?? ""), bold: true },
          ", en la Institución Educativa ( ",
          { text: marcaIE, bold: true },
          " ) o Centro Educativo ( ",
          { text: marcaCE, bold: true },
          " ) ",
          { text: valor(datos.institucion ?? ""), bold: true },
          ", del Municipio ",
          { text: valor(datos.municipio ?? ""), bold: true },
          ".",
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 14],
      },
      {
        text: "Por lo anterior le solicito presentarse en la Oficina de Recursos Humanos, ubicada en el Segundo Piso de la Gobernación de Risaralda, con el fin de tomar posesión del cargo.",
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 20],
      },
      { text: "Cordialmente,", style: "parrafo", margin: [0, 0, 0, 60] },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: COLUMNAS[0], style: "firmaCargo", alignment: "center" },
              {
                text: "Profesional Universitario RRHH",
                style: "firmaCargo",
                alignment: "center",
              },
            ],
          },
          {
            width: "50%",
            stack: [
              { text: COLUMNAS[1], style: "firmaCargo", alignment: "center" },
              {
                text: "Firma del Posesionado",
                style: "firmaCargo",
                alignment: "center",
              },
              {
                text: "C.C. No. ____________________",
                style: "firmaCargo",
                alignment: "center",
              },
              {
                text: "Aceptación del Cargo",
                style: "firmaCargo",
                alignment: "center",
              },
            ],
          },
        ],
        columnGap: 40,
      },
    ],
    styles: {
      paginaNum: { fontSize: 8 },
      campo: { fontSize: 10 },
      tituloActa: { fontSize: 12, bold: true },
      destinatario: { fontSize: 10, bold: true },
      asunto: { fontSize: 10, bold: true },
      parrafo: { fontSize: 10, margin: [0, 4, 0, 4] },
      firmaCargo: { fontSize: 9, margin: [0, 1, 0, 1] },
    },
    defaultStyle: { fontSize: 10 },
    images: {
      ...(encabImage ? { encabImage } : {}),
      ...(pieImage ? { pieImage } : {}),
    },
    info: {
      title: `Acta de posesión - ${valor(datos.nombre ?? "", "sin nombre")}`,
      author: "GOBERNACION DE RISARALDA",
    },
  };

  const numeroTxt = datos.numero ? String(datos.numero).padStart(3, "0") : "SIN_NUMERO";
  const nombreArchivo = `ACTA_POSESION_${numeroTxt}_${valor(
    datos.cedula ?? "",
    "sin_cedula"
  )}.pdf`;
  pdfMake.createPdf(docDefinition).download(nombreArchivo);
}
