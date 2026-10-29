export type DatosCartaPresentacion = {
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

export function construirCartaPresentacion(
  datos: DatosCartaPresentacion,
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
  const correo = obtener(extra, ["CORREO", "EMAIL", "CORREO ELECTRONICO", "CORREO ELECTRÓNICO"]);
  const elaboradoPor = valor(datos.elaboradoPor, "________________");
  const fecha = fechaLarga(new Date());

  const contenido: any[] = [
    {
      text: "CARTA DE PRESENTACIÓN",
      style: "titulo",
      alignment: "center",
      margin: [0, 0, 0, 24],
    },
    {
      text: [
        `Pereira, ${fecha}`,
      ],
      style: "parrafo",
      alignment: "right",
      margin: [0, 0, 0, 18],
    },
    {
      text: [
        "Señor(a): ",
        { text: "RECTOR(A) / DIRECTOR(A)", bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        { text: institucion, bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        { text: municipio, bold: true },
      ],
      style: "parrafo",
      margin: [0, 0, 0, 10],
    },
    ...(telefono || correo
      ? [
          {
            text: [
              "Teléfono celular: ",
              { text: valor(telefono), bold: true },
            ],
            style: "parrafo",
            margin: [0, 0, 0, 4],
          },
          {
            text: [
              "Correo electrónico: ",
              { text: valor(correo), bold: true },
            ],
            style: "parrafo",
            margin: [0, 0, 0, 12],
          },
        ]
      : []),
    {
      text: "Asunto: Presentación para toma de posesión",
      style: "parrafo",
      bold: true,
      margin: [0, 0, 0, 18],
    },
  ];

  if (esDocente) {
    contenido.push(
      {
        text: [
          "De la manera más cordial, me permito presentar al(la) señor(a) ",
          { text: nombre, bold: true },
          ", identificado(a) con cédula de ciudadanía N° ",
          { text: cedula, bold: true },
          ", para que tome posesión del cargo de ",
          { text: cargo, bold: true },
          " en ENCARGO, en esa Institución Educativa, de conformidad con el acto administrativo que lo(a) nombra.",
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Se solicita que, una vez verificados los requisitos, se proceda a recibirle la posesión y a tramitar lo correspondiente ante las instancias de Talento Humano.",
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Muy atentamente,",
        ],
        style: "parrafo",
        margin: [0, 40, 0, 40],
      }
    );
  } else {
    contenido.push(
      {
        text: [
          "De la manera más cordial, me permito presentar al(la) señor(a) ",
          { text: nombre, bold: true },
          ", identificado(a) con cédula de ciudadanía N° ",
          { text: cedula, bold: true },
          ", para que tome posesión del cargo de ",
          { text: cargo, bold: true },
          " en ENCARGO, en calidad de ",
          { text: vinculacion || "Administrativo/Numerario", bold: true },
          ", en esa Institución Educativa, de conformidad con el acto administrativo que lo(a) nombra.",
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Se solicita que se le reciba la posesión y se dé el trámite correspondiente.",
        ],
        style: "parrafo",
        alignment: "justify",
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          "Muy atentamente,",
        ],
        style: "parrafo",
        margin: [0, 40, 0, 40],
      }
    );
  }

  contenido.push(
    {
      columns: [
        {
          width: "50%",
          ...firma("Secretaria de Educación Departamental"),
        },
        {
          width: "50%",
          ...firma("Directora Administrativa y del Talento Humano"),
        },
      ],
      columnGap: 30,
      margin: [0, 20, 0, 30],
    },
    {
      text: [
        { text: "Elaboró: ", bold: true },
        { text: elaboradoPor },
      ],
      style: "parrafo",
    }
  );

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
      title: `Carta de Presentación - ${nombre}`,
      author: "GOBERNACION DE RISARALDA",
    },
  };
}

export async function generarCartaPresentacion(
  datos: DatosCartaPresentacion
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

  const docDefinition = construirCartaPresentacion(datos, { encabezado, pie });

  const nombreArchivo = `CARTA_PRESENTACION_${valor(
    datos.cedula ?? "",
    "sin_cedula"
  )}.pdf`;
  pdfMake.createPdf(docDefinition).download(nombreArchivo);
}
