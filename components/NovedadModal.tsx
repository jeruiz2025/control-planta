"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/cliente";
import { derivarNovedad } from "@/lib/logica";
import type { Catalogos, NovedadDTO, PersonaResumen } from "@/lib/types";

type Props = {
  novedad?: NovedadDTO | null;
  personaInicial?: PersonaResumen | null;
  catalogos: Catalogos;
  onGuardado: (novedad: NovedadDTO) => void;
  onCerrar: () => void;
};

const campoBase =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const etiqueta = "mb-0.5 block text-xs font-medium text-slate-600";

export default function NovedadModal({
  novedad,
  personaInicial,
  catalogos,
  onGuardado,
  onCerrar,
}: Props) {
  const persona = novedad?.persona ?? personaInicial ?? null;
  const [form, setForm] = useState({
    cedula: persona?.cedula ?? "",
    fechaRegistro: novedad?.fechaRegistro ?? new Date().toISOString().slice(0, 10),
    tipo: novedad?.tipo ?? "",
    desde: novedad?.desde ?? "",
    hasta: novedad?.hasta ?? "",
    estado: novedad?.estado ?? "Pendiente",
    observacion: novedad?.observacion ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const set = (campo: keyof typeof form, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const derivada = derivarNovedad({
    tipo: form.tipo,
    desde: form.desde || null,
    hasta: form.hasta || null,
    estado: form.estado,
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const cuerpo = {
        ...form,
        personaId: novedad?.personaId ?? persona?.id ?? null,
      };
      const datos = novedad
        ? await api<NovedadDTO>(`/api/novedades/${novedad.id}`, {
            method: "PUT",
            body: JSON.stringify(cuerpo),
          })
        : await api<NovedadDTO>("/api/novedades", {
            method: "POST",
            body: JSON.stringify(cuerpo),
          });
      onGuardado(datos);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  const clase =
    catalogos.tiposNovedad.find((t) => t.tipo === form.tipo)?.clase ?? "";

  return (
    <Modal
      titulo={
        novedad
          ? "Editar novedad"
          : persona
            ? `Nueva novedad · ${persona.nombre || "(sin nombre)"}`
            : "Registrar novedad"
      }
      onCerrar={onCerrar}
    >
      <form onSubmit={guardar} className="space-y-3">
        {persona ? (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              {persona.nombre || "(sin nombre)"}
            </span>{" "}
            · {persona.cedula || "s/c"} · {persona.municipio} ·{" "}
            {persona.institucion}
          </div>
        ) : (
          <div>
            <label className={etiqueta} htmlFor="cedula">
              Cédula *
            </label>
            <input
              id="cedula"
              className={campoBase}
              value={form.cedula}
              onChange={(e) => set("cedula", e.target.value)}
              placeholder="Debe existir en la planta"
              required
              autoFocus
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="fecha">
              Fecha de registro
            </label>
            <input
              id="fecha"
              type="date"
              className={campoBase}
              value={form.fechaRegistro}
              onChange={(e) => set("fechaRegistro", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="tipo">
              Tipo de novedad
            </label>
            <select
              id="tipo"
              className={campoBase}
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              required
            >
              <option value="">— Seleccionar —</option>
              {catalogos.tiposNovedad.map((t) => (
                <option key={t.tipo} value={t.tipo}>
                  {t.tipo} ({t.clase})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiqueta} htmlFor="desde">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              className={campoBase}
              value={form.desde}
              onChange={(e) => set("desde", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="hasta">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              className={campoBase}
              value={form.hasta}
              onChange={(e) => set("hasta", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="estado">
              Estado del trámite
            </label>
            <select
              id="estado"
              className={campoBase}
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
            >
              {catalogos.estados.map((e2) => (
                <option key={e2} value={e2}>
                  {e2}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={etiqueta} htmlFor="observacion">
              Observación
            </label>
            <textarea
              id="observacion"
              className={campoBase}
              rows={2}
              value={form.observacion}
              onChange={(e) => set("observacion", e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Cálculo automático
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Clase</dt>
              <dd className="font-semibold text-slate-800">
                {clase ? `${clase} (${derivada.clase})` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Días</dt>
              <dd className="font-semibold tabular-nums text-slate-800">
                {derivada.dias ?? "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Necesidad detectada</dt>
              <dd className="font-semibold text-slate-800">
                {derivada.necesidad || "—"}
              </dd>
            </div>
          </dl>
          <p
            className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
              derivada.requiereAccion
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            ¿Requiere acción? {derivada.requiereAccion ? "SÍ" : "NO"}
          </p>
        </div>

        {error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
