"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/cliente";
import {
  camposConValor,
  camposDesconocidos,
  GRUPOS_DATOS_EXTRA,
} from "@/lib/datosExtra";
import type { NovedadDTO, PersonaDTO } from "@/lib/types";

type Props = {
  personaId: number;
  onEditar: (persona: PersonaDTO) => void;
  onNovedad: (persona: PersonaDTO) => void;
  onCerrar: () => void;
};

const etiqueta = "text-[11px] font-medium uppercase tracking-wide text-slate-400";
const valor = "text-sm font-medium text-slate-800";

function Estado({ estado }: { estado: string }) {
  const tonos: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-800",
    "En trámite": "bg-sky-100 text-sky-800",
    Cubierta: "bg-emerald-100 text-emerald-800",
    "No requiere": "bg-slate-200 text-slate-600",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        tonos[estado] ?? "bg-slate-200 text-slate-600"
      }`}
    >
      {estado}
    </span>
  );
}

function DatosCompletos({ datos }: { datos: Record<string, string> }) {
  const grupos = GRUPOS_DATOS_EXTRA.map((grupo) => ({
    nombre: grupo.nombre,
    campos: camposConValor(grupo, datos),
  })).filter((grupo) => grupo.campos.length > 0);
  const otros = camposDesconocidos(datos);
  const total = Object.keys(datos).length;
  if (total === 0) return null;

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50/60">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-slate-700">
        Datos completos del Excel
        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {total} campos
        </span>
      </summary>
      <div className="space-y-4 border-t border-slate-200 px-3 py-3">
        {grupos.map((grupo) => (
          <section key={grupo.nombre}>
            <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {grupo.nombre}
            </h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {grupo.campos.map((campo) => (
                <div key={campo.clave} className="min-w-0">
                  <dt className={etiqueta}>{campo.etiqueta}</dt>
                  <dd className={`${valor} break-words`}>{datos[campo.clave]}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {otros.length > 0 && (
          <section>
            <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Otros datos
            </h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {otros.map((campo) => (
                <div key={campo.clave} className="min-w-0">
                  <dt className={etiqueta}>{campo.etiqueta}</dt>
                  <dd className={`${valor} break-words`}>{datos[campo.clave]}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </details>
  );
}

export default function DetallePersonaModal({
  personaId,
  onEditar,
  onNovedad,
  onCerrar,
}: Props) {
  const [persona, setPersona] = useState<(PersonaDTO & { novedades: NovedadDTO[] }) | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    api<PersonaDTO & { novedades: NovedadDTO[] }>(`/api/personas/${personaId}`)
      .then(setPersona)
      .catch((e: Error) => setError(e.message));
  }, [personaId]);

  if (error) {
    return (
      <Modal titulo="Detalle" onCerrar={onCerrar}>
        <p className="text-sm text-rose-600">{error}</p>
      </Modal>
    );
  }

  if (!persona) {
    return (
      <Modal titulo="Detalle" onCerrar={onCerrar}>
        <p className="py-8 text-center text-sm text-slate-500">Cargando…</p>
      </Modal>
    );
  }

  return (
    <Modal titulo={persona.nombre || "(sin nombre)"} onCerrar={onCerrar} ancho="max-w-4xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            ID {persona.id}
          </span>
          <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
            {persona.cedula || "sin cédula"}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {persona.grupo || "sin grupo"}
          </span>
          {persona.alerta && (
            <span className="rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
              {persona.alerta}
            </span>
          )}
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => onNovedad(persona)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              + Novedad
            </button>
            <button
              type="button"
              onClick={() => onEditar(persona)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Editar
            </button>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-4">
          <div>
            <p className={etiqueta}>Municipio</p>
            <p className={valor}>{persona.municipio || "—"}</p>
          </div>
          <div>
            <p className={etiqueta}>Institución</p>
            <p className={valor}>{persona.institucion || "—"}</p>
          </div>
          <div>
            <p className={etiqueta}>Sede</p>
            <p className={valor}>{persona.sede || "—"}</p>
          </div>
          <div>
            <p className={etiqueta}>Cargo</p>
            <p className={valor}>{persona.cargo || "—"}</p>
          </div>
          <div>
            <p className={etiqueta}>Vinculación</p>
            <p className={valor}>{persona.vinculacion || "—"}</p>
          </div>
          <div>
            <p className={etiqueta}>Fecha de nacimiento</p>
            <p className={valor}>{persona.fechaNacimiento || "—"}</p>
          </div>
          <div>
            <p className={etiqueta}>Edad</p>
            <p className={valor}>{persona.edad !== null ? `${persona.edad} años` : "—"}</p>
          </div>
          <div>
            <p className={etiqueta}>Novedad anterior</p>
            <p className={valor}>{persona.novedadAnterior || "—"}</p>
          </div>
        </div>

        <DatosCompletos datos={persona.datosExtra} />

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Novedades registradas ({persona.novedades.length})
          </h3>
          {persona.novedades.length === 0 ? (
            <p className="rounded-md bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
              Esta persona no tiene novedades registradas.
            </p>
          ) : (
            <div className="max-h-72 overflow-auto rounded-md border border-slate-200">
              <table className="tabla-base">
                <thead>
                  <tr>
                    <th>Registro</th>
                    <th>Tipo</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th className="text-right">Días</th>
                    <th>Necesidad</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {persona.novedades.map((n) => (
                    <tr key={n.id}>
                      <td className="whitespace-nowrap">{n.fechaRegistro}</td>
                      <td>{n.tipo}</td>
                      <td className="whitespace-nowrap">{n.desde ?? "—"}</td>
                      <td className="whitespace-nowrap">{n.hasta ?? "—"}</td>
                      <td className="text-right tabular-nums">{n.dias ?? "—"}</td>
                      <td>{n.necesidad || "—"}</td>
                      <td>
                        <Estado estado={n.estado} />
                      </td>
                      <td>
                        {n.requiereAccion ? (
                          <span className="font-bold text-amber-600">SÍ</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
