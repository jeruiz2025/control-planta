import { alertaDeEdad, calcularEdad } from "./logica";
import type { NovedadDTO, PersonaDTO, PersonaRegistro } from "./types";

export function aPersonaDTO(p: PersonaRegistro): PersonaDTO {
  const edad = calcularEdad(p.fechaNacimiento);
  return {
    id: p.id,
    municipio: p.municipio,
    institucion: p.institucion,
    sede: p.sede,
    grupo: p.grupo,
    cargo: p.cargo,
    nombre: p.nombre,
    cedula: p.cedula,
    vinculacion: p.vinculacion,
    fechaNacimiento: p.fechaNacimiento,
    novedadAnterior: p.novedadAnterior,
    edad,
    alerta: alertaDeEdad(edad),
    _count: p._count,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

export function aNovedadDTO(n: {
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
  updatedAt: Date;
  persona?: PersonaRegistro;
}): NovedadDTO {
  const { persona, ...resto } = n;
  return {
    ...resto,
    updatedAt: n.updatedAt instanceof Date ? n.updatedAt.toISOString() : String(n.updatedAt),
    persona: persona
      ? {
          id: persona.id,
          nombre: persona.nombre,
          cedula: persona.cedula,
          municipio: persona.municipio,
          institucion: persona.institucion,
          cargo: persona.cargo,
          grupo: persona.grupo,
        }
      : undefined,
  };
}
