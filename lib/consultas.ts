import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ESTADOS, TIPOS_AUSENCIA, VIABILIZADAS, DIAS_HABILES_ANIO } from "./constantes";
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

function contar(mapa: Map<string, number>, clave: string) {
  mapa.set(clave, (mapa.get(clave) ?? 0) + 1);
}

function acumular(mapa: Map<string, number[]>, clave: string, valor: number) {
  const arr = mapa.get(clave);
  if (arr) arr.push(valor);
  else mapa.set(clave, [valor]);
}

function aLista(mapa: Map<string, number>): { nombre: string; total: number }[] {
  return [...mapa.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total || compararTexto(a.nombre, b.nombre));
}

function promediosDe(mapa: Map<string, number[]>): { nombre: string; total: number }[] {
  return [...mapa.entries()]
    .map(([nombre, arr]) => ({
      nombre,
      total: arr.length
        ? Math.round((arr.reduce((s, e) => s + e, 0) / arr.length) * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.total - a.total || compararTexto(a.nombre, b.nombre));
}

function diasEntre(desde: string, hasta: string): number {
  const d = Date.parse(hasta) - Date.parse(desde);
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.round(d / 86400000)) + 1;
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
  const vacantesPorMunicipio = new Map<string, number>();
  const vacantesPorGrupo = new Map<string, number>();
  const retirosMap = new Map<number, number>();
  const edadesPorGrupo = new Map<string, number[]>();
  const edadesPorMunicipio = new Map<string, number[]>();
  const edades: number[] = [];
  const anioActual = new Date().getFullYear();
  let mayores65 = 0;
  let proximos65 = 0;
  let provisionales = 0;
  let vacDefinitivas = 0;
  let vacTemporales = 0;
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
    if (p.edad !== null) {
      edades.push(p.edad);
      acumular(edadesPorGrupo, p.grupo || "(sin grupo)", p.edad);
      acumular(edadesPorMunicipio, p.municipio || "(sin municipio)", p.edad);
    }
    if (p.edad !== null && p.edad >= 65) {
      mayores65 += 1;
      inst.mayores65 += 1;
    }
    if (p.edad !== null && p.edad >= 64 && p.edad < 65) proximos65 += 1;
    if (p.edad !== null && p.edad < 65 && p.fechaNacimiento.length >= 4) {
      const anio65 = Number(p.fechaNacimiento.slice(0, 4)) + 65;
      if (anio65 >= anioActual) {
        retirosMap.set(anio65, (retirosMap.get(anio65) ?? 0) + 1);
      }
    }
    if (
      p.vinculacion === "Prov. vacante definitiva" ||
      p.vinculacion === "Prov. vacante temporal"
    ) {
      contar(vacantesPorMunicipio, p.municipio || "(sin municipio)");
      contar(vacantesPorGrupo, p.grupo || "(sin grupo)");
      if (p.vinculacion === "Prov. vacante definitiva") {
        vacDefinitivas += 1;
        provisionales += 1;
      } else {
        vacTemporales += 1;
      }
    }
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

  const red1 = (n: number) => Math.round(n * 10) / 10;
  const ordenados = [...edades].sort((a, b) => a - b);
  const promedio = edades.length
    ? red1(ordenados.reduce((s, e) => s + e, 0) / edades.length)
    : null;
  const mediana = edades.length
    ? red1(
        ordenados.length % 2
          ? ordenados[(ordenados.length - 1) / 2]
          : (ordenados[ordenados.length / 2 - 1] +
              ordenados[ordenados.length / 2]) /
              2
      )
    : null;
  const pctDe = (n: number) =>
    edades.length ? Math.round((n / edades.length) * 1000) / 10 : 0;
  const pct55 = pctDe(edades.filter((e) => e >= 55).length);
  const pct60 = pctDe(edades.filter((e) => e >= 60).length);

  const tiposAusencia = new Set<string>(TIPOS_AUSENCIA);
  const diasPorAnio = new Map<string, number>();
  const diasPorInstitucion = new Map<string, number>();
  let diasAusentismo = 0;
  let diasAnioActual = 0;
  for (const n of novedades) {
    if (!tiposAusencia.has(n.tipo)) continue;
    const dias = n.dias ?? (n.desde && n.hasta ? diasEntre(n.desde, n.hasta) : 0);
    if (dias <= 0) continue;
    const anio = (n.desde || n.fechaRegistro).slice(0, 4);
    diasAusentismo += dias;
    diasPorAnio.set(anio, (diasPorAnio.get(anio) ?? 0) + dias);
    if (Number(anio) === anioActual) diasAnioActual += dias;
    if (n.persona) {
      const clave = `${n.persona.municipio}\u0000${n.persona.institucion}`;
      diasPorInstitucion.set(clave, (diasPorInstitucion.get(clave) ?? 0) + dias);
    }
  }
  const indiceAnual = personas.length
    ? Math.round((diasAnioActual / (DIAS_HABILES_ANIO * personas.length)) * 1000) / 10
    : null;

  const pendientes = novedades.filter(
    (n) => n.estado === "Pendiente" || n.estado === "En trámite"
  );
  const cubiertas = novedades.filter((n) => n.estado === "Cubierta");
  const pctCubiertas = novedades.length
    ? Math.round((cubiertas.length / novedades.length) * 100)
    : 0;
  const hoy = Date.now();
  const diasPromedioPendiente = pendientes.length
    ? Math.round(
        pendientes.reduce(
          (s, n) =>
            s + Math.max(0, (hoy - Date.parse(n.fechaRegistro)) / 86400000),
          0
        ) / pendientes.length
      )
    : null;
  const tipoMasFrecuente =
    [...tipos.values()].sort((a, b) => b.total - a.total)[0]?.tipo ?? null;

  const topProblemas = [...porInstitucion.values()]
    .map((i) => ({
      municipio: i.municipio,
      institucion: i.institucion,
      vacantes: i.provDefinitiva + i.provTemporal,
      novedades: i.novedadesPorAtender,
      total: i.provDefinitiva + i.provTemporal + i.novedadesPorAtender,
    }))
    .filter((x) => x.total > 0)
    .sort(
      (a, b) =>
        b.total - a.total ||
        compararTexto(a.institucion, b.institucion) ||
        compararTexto(a.municipio, b.municipio)
    )
    .slice(0, 10);

  const sinFechaNacimiento = personas.length - edades.length;
  const sinCedula = personas.filter((p) => !p.cedula).length;
  const imposibles = edades.filter((e) => e < 15).length;
  const incompletos = personas.filter(
    (p) => p.edad === null || !p.cedula || p.edad < 15
  ).length;
  const pctCompleto = personas.length
    ? Math.round(((personas.length - incompletos) / personas.length) * 1000) / 10
    : 0;

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
    vacantes: {
      total: vacDefinitivas + vacTemporales,
      definitivas: vacDefinitivas,
      temporales: vacTemporales,
      porMunicipio: aLista(vacantesPorMunicipio),
      porGrupo: aLista(vacantesPorGrupo),
    },
    retiros: [...retirosMap.entries()]
      .map(([anio, total]) => ({ anio, total }))
      .sort((a, b) => a.anio - b.anio),
    perfilEdad: {
      promedio,
      mediana,
      pct55,
      pct60,
      base: edades.length,
      porGrupo: promediosDe(edadesPorGrupo),
      porMunicipio: promediosDe(edadesPorMunicipio),
    },
    ausentismo: {
      dias: diasAusentismo,
      anioActual,
      diasActuales: diasAnioActual,
      indiceAnual,
      diasPorAnio: [...diasPorAnio.entries()]
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => compararTexto(a.nombre, b.nombre)),
      topInstituciones: [...diasPorInstitucion.entries()]
        .map(([clave, total]) => {
          const [municipio, institucion] = clave.split("\u0000");
          return { nombre: `${institucion} (${municipio})`, total };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    },
    gestionNovedades: {
      total: novedades.length,
      pendientes: pendientes.length,
      cubiertas: cubiertas.length,
      pctCubiertas,
      diasPromedioPendiente,
      tipoMasFrecuente,
    },
    topProblemas,
    calidadDatos: {
      sinFechaNacimiento,
      sinCedula,
      imposibles,
      incompletos,
      pctCompleto,
    },
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

