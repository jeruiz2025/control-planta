"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/cliente";
import { alertaDeEdad, calcularEdad } from "@/lib/logica";
import type { Catalogos, PersonaDTO } from "@/lib/types";

type Props = {
  persona: PersonaDTO | null;
  catalogos: Catalogos;
  onGuardado: (persona: PersonaDTO) => void;
  onCerrar: () => void;
};

const campoBase =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const etiqueta = "mb-0.5 block text-xs font-medium text-slate-600";

export default function PersonaModal({
  persona,
  catalogos,
  onGuardado,
  onCerrar,
}: Props) {
  const [form, setForm] = useState({
    nombre: persona?.nombre ?? "",
    cedula: persona?.cedula ?? "",
    municipio: persona?.municipio ?? "",
    institucion: persona?.institucion ?? "",
    sede: persona?.sede ?? "",
    grupo: persona?.grupo ?? "",
    cargo: persona?.cargo ?? "",
    vinculacion: persona?.vinculacion ?? "",
    fechaNacimiento: persona?.fechaNacimiento ?? "",
    novedadAnterior: persona?.novedadAnterior ?? "",
    direccion: persona?.direccion ?? "",
    telefono: persona?.telefono ?? "",
    correo: persona?.correo ?? "",
    nivel: persona?.nivel ?? "",
    area: persona?.area ?? "",
    tipoInstitucion: persona?.tipoInstitucion ?? "",
    autoriza: persona?.autoriza ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const set = (campo: keyof typeof form, valor: string | boolean) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const edad = calcularEdad(form.fechaNacimiento);
  const alerta = alertaDeEdad(edad);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const datos = persona
        ? await api<PersonaDTO>(`/api/personas/${persona.id}`, {
            method: "PUT",
            body: JSON.stringify(form),
          })
        : await api<PersonaDTO>("/api/personas", {
            method: "POST",
            body: JSON.stringify(form),
          });
      onGuardado(datos);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={persona ? `Editar · ${persona.nombre || "(sin nombre)"}` : "Alta en la planta"}
      onCerrar={onCerrar}
    >
      <form onSubmit={guardar} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={etiqueta} htmlFor="nombre">
              Nombre *
            </label>
            <input
              id="nombre"
              className={campoBase}
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="cedula">
              Cédula
            </label>
            <input
              id="cedula"
              className={campoBase}
              value={form.cedula}
              onChange={(e) => set("cedula", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="grupo">
              Grupo
            </label>
            <input
              id="grupo"
              className={campoBase}
              list="lista-grupos"
              value={form.grupo}
              onChange={(e) => set("grupo", e.target.value)}
            />
            <datalist id="lista-grupos">
              {catalogos.grupos.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={etiqueta} htmlFor="municipio">
              Municipio
            </label>
            <input
              id="municipio"
              className={campoBase}
              list="lista-municipios"
              value={form.municipio}
              onChange={(e) => set("municipio", e.target.value)}
            />
            <datalist id="lista-municipios">
              {catalogos.municipios.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={etiqueta} htmlFor="institucion">
              Institución
            </label>
            <input
              id="institucion"
              className={campoBase}
              list="lista-instituciones"
              value={form.institucion}
              onChange={(e) => set("institucion", e.target.value)}
            />
            <datalist id="lista-instituciones">
              {catalogos.instituciones.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label className={etiqueta} htmlFor="sede">
              Sede
            </label>
            <input
              id="sede"
              className={campoBase}
              value={form.sede}
              onChange={(e) => set("sede", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="cargo">
              Cargo
            </label>
            <input
              id="cargo"
              className={campoBase}
              list="lista-cargos"
              value={form.cargo}
              onChange={(e) => set("cargo", e.target.value)}
            />
            <datalist id="lista-cargos">
              {catalogos.cargos.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={etiqueta} htmlFor="vinculacion">
              Vinculación
            </label>
            <select
              id="vinculacion"
              className={campoBase}
              value={form.vinculacion}
              onChange={(e) => set("vinculacion", e.target.value)}
            >
              <option value="">—</option>
              {catalogos.vinculaciones.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiqueta} htmlFor="nacimiento">
              Fecha de nacimiento
            </label>
            <input
              id="nacimiento"
              type="date"
              className={campoBase}
              value={form.fechaNacimiento}
              onChange={(e) => set("fechaNacimiento", e.target.value)}
            />
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Edad calculada</p>
            <p className="text-sm font-semibold text-slate-800">
              {edad !== null ? `${edad} años` : "—"}
            </p>
            {alerta && (
              <p className="text-[11px] font-medium text-rose-600">{alerta}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={etiqueta} htmlFor="novedad">
              Novedad (texto anterior)
            </label>
            <input
              id="novedad"
              className={campoBase}
              value={form.novedadAnterior}
              onChange={(e) => set("novedadAnterior", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={etiqueta} htmlFor="direccion">
              Dirección
            </label>
            <input
              id="direccion"
              className={campoBase}
              value={form.direccion}
              onChange={(e) => set("direccion", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="telefono">
              Teléfono celular
            </label>
            <input
              id="telefono"
              className={campoBase}
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="correo">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              className={campoBase}
              value={form.correo}
              onChange={(e) => set("correo", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="nivel">
              Nivel
            </label>
            <input
              id="nivel"
              className={campoBase}
              list="lista-niveles"
              value={form.nivel}
              onChange={(e) => set("nivel", e.target.value)}
            />
            <datalist id="lista-niveles">
              {["Preescolar", "Básica primaria", "Básica secundaria", "Media técnica", "Media académica"].map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={etiqueta} htmlFor="area">
              Área
            </label>
            <input
              id="area"
              className={campoBase}
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="tipoInstitucion">
              Tipo de establecimiento
            </label>
            <select
              id="tipoInstitucion"
              className={campoBase}
              value={form.tipoInstitucion}
              onChange={(e) => set("tipoInstitucion", e.target.value)}
            >
              <option value="">—</option>
              <option value="IE">Institución Educativa (IE)</option>
              <option value="CE">Centro Educativo (CE)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              id="autoriza"
              type="checkbox"
              checked={form.autoriza}
              onChange={(e) => set("autoriza", e.target.checked)}
            />
            <label className="text-xs text-slate-600" htmlFor="autoriza">
              Autoriza notificación por correo
            </label>
          </div>
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
