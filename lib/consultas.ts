import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ESTADOS, VIABILIZADAS } from "./constantes";
import { aNovedadDTO, aPersonaDTO } from "./serializacion";
import type {
  Estadisticas,
  InstitucionDTO,
  ResultadoPaginado,
} from "./types";

export type Params = Record<string, string | null | undefined>;

function valor(params: Params, clave: string): string {
  return (params[clave] ?? "").trim();
}

function paginar<T>(
  datos: T[],
  params: Params,
  todo: boolean
): ResultadoPaginado<T> {
  const pagina = Math.max(1, Number(valor(params, "pagina")) || 1);
  const porPagina = Math.min(
    500,
    Math.max(5, Number(valor(params, "porPagina")) || 25)
  );
  if (todo) {
    return { datos, total: datos.length, pagina: 1, paginas: 1 };
  }
  const inicio = (pagina - 1) * porPagina;
  return {
    datos: datos.slice(inicio, inicio + porPagina),
    total: datos.length,
    pagina,
    paginas: Math.max(1, Math.ceil(datos.length / porPagina)),
  };
}

function filtroPersona(params: Params): Prisma.PersonaWhereInput {
  const clausulas: Prisma.PersonaWhereInput[] = [];
  const q = valor(params, "q");
  if (q) {
    clausulas.push({
      OR: [
        { nombre: { contains: q } },
        { cedula: { contains: q } },
        { cargo: { contains: q } },
        { institucion: { contains: q } },
        { sede: { contains: q } },
      ],
    });
  }
  const municipio = valor(params, "municipio");
  if (municipio) clausulas.push({ municipio });
  const institucion = valor(params, "institucion");
  if (institucion) clausulas.push({ institucion });
  const grupo = valor(params, "grupo");
  if (grupo) clausulas.push({ grupo });
  const vinculacion = valor(params, "vinculacion");
  if (vinculacion) clausulas.push({ vinculacion });
  return clausulas.length ? { AND: clausulas } : {};
}

function compararTexto(a: string, b: string): number {
  return a.localeCompare(b, "es");
}

function ordenarPersonas(
  datos: ReturnType<typeof aPersonaDTO>[],
  orden: string,
  direccion: string
) {
  const signo = direccion === "desc" ? -1 : 1;
  const copia = [...datos];
  copia.sort((a, b) => {
    let r = 0;
    if (orden === "edad") {
      if (a.edad === null && b.edad === null) return 0;
      if (a.edad === null) return 1;
      if (b.edad === null) return -1;
      return (a.edad - b.edad) * signo;
    }
    if (orden === "municipio") r = compararTexto(a.municipio, b.municipio);
    else if (orden === "institucion") r = compararTexto(a.institucion, b.institucion);
    else if (orden === "sede") r = compararTexto(a.sede, b.sede);
    else if (orden === "grupo") r = compararTexto(a.grupo, b.grupo);
    else if (orden === "cargo") r = compararTexto(a.cargo, b.cargo);
    else if (orden === "cedula") r = compararTexto(a.cedula, b.cedula);
    else if (orden === "vinculacion") r = compararTexto(a.vinculacion, b.vinculacion);
    else r = compararTexto(a.nombre, b.nombre);
    if (r === 0) r = compararTexto(a.nombre, b.nombre);
    if (r === 0) r = a.id - b.id;
    return r * signo;
  });
  return copia;
}

export async function buscarPersonas(
  params: Params
): Promise<ResultadoPaginado<ReturnType<typeof aPersonaDTO>>> {
  const filas = await prisma.persona.findMany({
    where: filtroPersona(params),
    include: { _count: { select: { novedades: true } } },
  });
  let datos = filas.map(aPersonaDTO);

  const alerta = valor(params, "alerta");
  if (alerta === "65") datos = datos.filter((d) => d.edad !== null && d.edad >= 65);
  if (alerta === "64")
    datos = datos.filter((d) => d.edad !== null && d.edad >= 64 && d.edad < 65);
  if (valor(params, "conNovedad") === "1") {
    const novedades = await prisma.novedad.findMany({
      select: { personaId: true },
    });
    const ids = new Set(novedades.map((n) => n.personaId));
    datos = datos.filter((d) => ids.has(d.id));
  }

  datos = ordenarPersonas(
    datos,
    valor(params, "orden") || "nombre",
    valor(params, "dir") || "asc"
  );
  return paginar(datos, params, valor(params, "todo") === "1");
}

export async function buscarNovedades(
  params: Params
): Promise<ResultadoPaginado<ReturnType<typeof aNovedadDTO>>> {
  const clausulas: Prisma.NovedadWhereInput[] = [];
  const estado = valor(params, "estado");
  if (estado) clausulas.push({ estado });
  const tipo = valor(params, "tipo");
  if (tipo) clausulas.push({ tipo });
  const atender = valor(params, "requiereAccion");
  if (atender === "1") clausulas.push({ requiereAccion: true });
  if (atender === "0") clausulas.push({ requiereAccion: false });
  const personaId = valor(params, "personaId");
  if (personaId) clausulas.push({ personaId: Number(personaId) });
  const municipio = valor(params, "municipio");
  if (municipio) clausulas.push({ persona: { municipio } });
  const q = valor(params, "q");
  if (q) {
    clausulas.push({
      OR: [
        { persona: { nombre: { contains: q } } },
        { persona: { cedula: { contains: q } } },
        { persona: { institucion: { contains: q } } },
        { observacion: { contains: q } },
      ],
    });
  }

  const filas = await prisma.novedad.findMany({
    where: clausulas.length ? { AND: clausulas } : {},
    include: { persona: true },
    orderBy: [{ fechaRegistro: "desc" }, { createdAt: "desc" }],
  });
  const datos = filas.map(aNovedadDTO);
  return paginar(datos, params, valor(params, "todo") === "1");
}

function rangoDeEdad(edad: number | null): string {
  if (edad === null) return "Sin fecha";
  if (edad < 30) return "Menos de 30";
  if (edad < 40) return "30 a 39";
  if (edad < 50) return "40 a 49";
  if (edad < 60) return "50 a 59";
  if (edad < 65) return "60 a 64";
  return "65 o más";
}

const ORDEN_RANGOS = [
  "Menos de 30",
  "30 a 39",
  "40 a 49",
  "50 a 59",
  "60 a 64",
  "65 o más",
  "Sin fecha",
];

export async function calcularEstadisticas(): Promise<Estadisticas> {
  const [filas, novedades] = await Promise.all([
    prisma.persona.findMany(),
    prisma.novedad.findMany({ include: { persona: true } }),
  ]);
  const personas = filas.map(aPersonaDTO);

  const porGrupo: Record<string, number> = {};
  const porMunicipio = new Map<
    string,
    { nombre: string; total: number; porGrupo: Record<string, number> }
  >();
  const porVinculacion = new Map<string, number>();
  const porInstitucion = new Map<string, InstitucionDTO>();
  const rangos = new Map<string, number>();
  let mayores65 = 0;
  let proximos65 = 0;
  let provisionales = 0;
  let actualizado = "";

  for (const p of personas) {
    porGrupo[p.grupo] = (porGrupo[p.grupo] ?? 0) + 1;

    let entrada = porMunicipio.get(p.municipio);
    if (!entrada) {
      entrada = { nombre: p.municipio || "(sin municipio)", total: 0, porGrupo: {} };
      porMunicipio.set(p.municipio, entrada);
    }
    entrada.total += 1;
    entrada.porGrupo[p.grupo] = (entrada.porGrupo[p.grupo] ?? 0) + 1;

    porVinculacion.set(
      p.vinculacion || "(sin dato)",
      (porVinculacion.get(p.vinculacion || "(sin dato)") ?? 0) + 1
    );

    const clave = `${p.municipio}\u0000${p.institucion}`;
    let inst = porInstitucion.get(clave);
    if (!inst) {
      inst = {
        municipio: p.municipio,
        institucion: p.institucion,
        docentes: 0,
        directivos: 0,
        administrativos: 0,
        total: 0,
        propiedad: 0,
        provDefinitiva: 0,
        provTemporal: 0,
        temporalPTA: 0,
        otros: 0,
        novedadesPorAtender: 0,
        mayores65: 0,
      };
      porInstitucion.set(clave, inst);
    }
    inst.total += 1;
    if (p.grupo === "Docente") inst.docentes += 1;
    else if (p.grupo === "Directivo") inst.directivos += 1;
    else if (p.grupo === "Administrativo") inst.administrativos += 1;
    if (p.vinculacion === "Propiedad") inst.propiedad += 1;
    else if (p.vinculacion === "Prov. vacante definitiva") inst.provDefinitiva += 1;
    else if (p.vinculacion === "Prov. vacante temporal") inst.provTemporal += 1;
    else if (p.vinculacion === "Temporal / PTA") inst.temporalPTA += 1;
    else inst.otros += 1;

    const rango = rangoDeEdad(p.edad);
    rangos.set(rango, (rangos.get(rango) ?? 0) + 1);
    if (p.edad !== null && p.edad >= 65) {
      mayores65 += 1;
      inst.mayores65 += 1;
    }
    if (p.edad !== null && p.edad >= 64 && p.edad < 65) proximos65 += 1;
    if (p.vinculacion === "Prov. vacante definitiva") provisionales += 1;
    if (p.updatedAt > actualizado) actualizado = p.updatedAt;
  }

  const novedadesPorAtender = novedades.filter((n) => n.requiereAccion).length;
  for (const n of novedades) {
    const inst = porInstitucion.get(
      `${n.persona?.municipio ?? ""}\u0000${n.persona?.institucion ?? ""}`
    );
    if (inst && n.requiereAccion) inst.novedadesPorAtender += 1;
  }

  const novedadesPorEstado = ESTADOS.map((estado) => ({
    estado,
    total: novedades.filter((n) => n.estado === estado).length,
  }));
  const tipos = new Map<string, { tipo: string; total: number; porAtender: number }>();
  for (const n of novedades) {
    let entrada = tipos.get(n.tipo);
    if (!entrada) {
      entrada = { tipo: n.tipo, total: 0, porAtender: 0 };
      tipos.set(n.tipo, entrada);
    }
    entrada.total += 1;
    if (n.requiereAccion) entrada.porAtender += 1;
  }

  const viabilizadas = { ...VIABILIZADAS };
  const diferenciaViabilizacion: Record<string, number> = {};
  for (const grupo of Object.keys(viabilizadas)) {
    diferenciaViabilizacion[grupo] =
      (porGrupo[grupo] ?? 0) - viabilizadas[grupo];
  }

  return {
    totalPersonas: personas.length,
    instituciones: porInstitucion.size,
    municipios: porMunicipio.size,
    porGrupo,
    viabilizadas,
    diferenciaViabilizacion,
    mayores65,
    proximos65,
    provisionalesVacanteDefinitiva: provisionales,
    novedadesPorAtender,
    totalNovedades: novedades.length,
    porMunicipio: [...porMunicipio.values()].sort((a, b) =>
      compararTexto(a.nombre, b.nombre)
    ),
    porVinculacion: [...porVinculacion.entries()]
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total),
    porInstitucion: [...porInstitucion.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 12),
    porRangoEdad: ORDEN_RANGOS.filter((r) => rangos.has(r)).map((rango) => ({
      rango,
      total: rangos.get(rango) ?? 0,
    })),
    novedadesPorEstado,
    novedadesPorTipo: [...tipos.values()].sort((a, b) => b.total - a.total),
    actualizado,
  };
}

export async function agregadoInstituciones(): Promise<InstitucionDTO[]> {
  const [filas, novedades] = await Promise.all([
    prisma.persona.findMany(),
    prisma.novedad.findMany({
      where: { requiereAccion: true },
      include: { persona: true },
    }),
  ]);
  const mapa = new Map<string, InstitucionDTO>();

  for (const fila of filas) {
    const p = aPersonaDTO(fila);
    const clave = `${p.municipio}\u0000${p.institucion}`;
    let inst = mapa.get(clave);
    if (!inst) {
      inst = {
        municipio: p.municipio,
        institucion: p.institucion,
        docentes: 0,
        directivos: 0,
        administrativos: 0,
        total: 0,
        propiedad: 0,
        provDefinitiva: 0,
        provTemporal: 0,
        temporalPTA: 0,
        otros: 0,
        novedadesPorAtender: 0,
        mayores65: 0,
      };
      mapa.set(clave, inst);
    }
    inst.total += 1;
    if (p.grupo === "Docente") inst.docentes += 1;
    else if (p.grupo === "Directivo") inst.directivos += 1;
    else if (p.grupo === "Administrativo") inst.administrativos += 1;
    if (p.vinculacion === "Propiedad") inst.propiedad += 1;
    else if (p.vinculacion === "Prov. vacante definitiva") inst.provDefinitiva += 1;
    else if (p.vinculacion === "Prov. vacante temporal") inst.provTemporal += 1;
    else if (p.vinculacion === "Temporal / PTA") inst.temporalPTA += 1;
    else inst.otros += 1;
    if (p.edad !== null && p.edad >= 65) inst.mayores65 += 1;
  }

  for (const n of novedades) {
    if (!n.persona) continue;
    const inst = mapa.get(
      `${n.persona.municipio}\u0000${n.persona.institucion}`
    );
    if (inst) inst.novedadesPorAtender += 1;
  }

  return [...mapa.values()].sort(
    (a, b) =>
      compararTexto(a.municipio, b.municipio) ||
      compararTexto(a.institucion, b.institucion)
  );
}

