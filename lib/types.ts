export type PersonaRegistro = {
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
  datosExtra?: string;
  updatedAt: Date;
  _count?: { novedades: number };
};

export type PersonaDTO = {
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
  datosExtra: Record<string, string>;
  edad: number | null;
  alerta: string;
  updatedAt: string;
  novedades?: NovedadDTO[];
  _count?: { novedades: number };
};

export type NovedadDTO = {
  id: string;
  personaId: number;
  fechaRegistro: string;
  tipo: string;
  clase: string;
  desde: string | null;
  hasta: string | null;
  dias: number | null;
  necesidad: string;
  estado: string;
  requiereAccion: boolean;
  observacion: string;
  updatedAt: string;
  persona?: PersonaResumen;
};

export type PersonaResumen = {
  id: number;
  nombre: string;
  cedula: string;
  municipio: string;
  institucion: string;
  cargo: string;
  grupo: string;
};

export type Estadisticas = {
  totalPersonas: number;
  instituciones: number;
  municipios: number;
  porGrupo: Record<string, number>;
  viabilizadas: Record<string, number>;
  diferenciaViabilizacion: Record<string, number>;
  mayores65: number;
  mayores70: number;
  proximos65: number;
  provisionalesVacanteDefinitiva: number;
  novedadesPorAtender: number;
  totalNovedades: number;
  porMunicipio: { nombre: string; total: number; porGrupo: Record<string, number> }[];
  porVinculacion: { nombre: string; total: number }[];
  porInstitucion: InstitucionDTO[];
  porRangoEdad: { rango: string; total: number }[];
  novedadesPorEstado: { estado: string; total: number }[];
  novedadesPorTipo: { tipo: string; total: number; porAtender: number }[];
  vacantes: {
    total: number;
    definitivas: number;
    temporales: number;
    porMunicipio: { nombre: string; total: number }[];
    porGrupo: { nombre: string; total: number }[];
  };
  retiros: { anio: number; total: number }[];
  perfilEdad: {
    promedio: number | null;
    mediana: number | null;
    pct55: number;
    pct60: number;
    base: number;
    porGrupo: { nombre: string; total: number }[];
    porMunicipio: { nombre: string; total: number }[];
  };
  ausentismo: {
    dias: number;
    anioActual: number;
    diasActuales: number;
    indiceAnual: number | null;
    diasPorAnio: { nombre: string; total: number }[];
    topInstituciones: { nombre: string; total: number }[];
  };
  gestionNovedades: {
    total: number;
    pendientes: number;
    cubiertas: number;
    pctCubiertas: number;
    diasPromedioPendiente: number | null;
    tipoMasFrecuente: string | null;
  };
  topProblemas: {
    municipio: string;
    institucion: string;
    vacantes: number;
    novedades: number;
    total: number;
  }[];
  calidadDatos: {
    sinFechaNacimiento: number;
    sinCedula: number;
    imposibles: number;
    incompletos: number;
    pctCompleto: number;
  };
  actualizado: string;
};

export type InstitucionDTO = {
  municipio: string;
  institucion: string;
  docentes: number;
  directivos: number;
  administrativos: number;
  total: number;
  propiedad: number;
  provDefinitiva: number;
  provTemporal: number;
  temporalPTA: number;
  otros: number;
  novedadesPorAtender: number;
  mayores65: number;
};

export type Catalogos = {
  municipios: string[];
  instituciones: string[];
  cargos: string[];
  grupos: string[];
  vinculaciones: string[];
  tiposNovedad: { tipo: string; clase: string }[];
  estados: string[];
};

export type ResultadoPaginado<T> = {
  datos: T[];
  total: number;
  pagina: number;
  paginas: number;
};
