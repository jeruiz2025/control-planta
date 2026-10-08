export const GRUPOS = ["Docente", "Directivo", "Administrativo"] as const;

export const TIPOS_NOVEDAD: Record<string, string> = {
  Renuncia: "d",
  "Retiro / pensión": "d",
  Fallecimiento: "d",
  "Destitución / abandono del cargo": "d",
  "Retiro forzoso (65 años)": "d",
  Licencia: "t",
  "Comisión": "t",
  "Permiso sindical": "t",
  Incapacidad: "t",
  Vacaciones: "t",
  Traslado: "m",
  "Encargo a otro cargo": "e",
  "Vence nombramiento temporal": "v",
};

export const CLASES: Record<string, string> = {
  d: "Definitiva",
  t: "Temporal",
  m: "Traslado",
  e: "Encargo",
  v: "Vence",
};

export const ESTADOS = ["Pendiente", "En trámite", "Cubierta", "No requiere"];

export const TIPOS_AUSENCIA = ["Licencia", "Incapacidad", "Permiso sindical"];

export const DIAS_HABILES_ANIO = 250;

export const DIAS_MINIMO_REEMPLAZO = 15;

export const VIABILIZADAS: Record<string, number> = {
  Docente: 2332,
  Directivo: 148,
  Administrativo: 327,
};

export const VINCULACIONES = [
  "Propiedad",
  "Prov. vacante definitiva",
  "Prov. vacante temporal",
  "Temporal / PTA",
  "Periodo de prueba",
  "Sin dato",
];
