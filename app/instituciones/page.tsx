"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/cliente";
import { TarjetaKPI } from "@/components/Graficas";
import type { InstitucionDTO } from "@/lib/types";

const campo =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const etiquetaCampo = "mb-0.5 block text-[11px] font-medium text-slate-500";

export default function InstitucionesPage() {
  const [datos, setDatos] = useState<InstitucionDTO[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [municipio, setMunicipio] = useState("");
  const [q, setQ] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<InstitucionDTO[]>("/api/instituciones")
      .then(setDatos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
    api<{ municipios: string[] }>("/api/catalogos")
      .then((c) => setMunicipios(c.municipios))
      .catch(() => undefined);
  }, []);

  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return datos.filter(
      (i) =>
        (!municipio || i.municipio === municipio) &&
        (!texto || i.institucion.toLowerCase().includes(texto))
    );
  }, [datos, municipio, q]);

  const totales = useMemo(
    () =>
      filtradas.reduce(
        (acc, i) => ({
          docentes: acc.docentes + i.docentes,
          directivos: acc.directivos + i.directivos,
          administrativos: acc.administrativos + i.administrativos,
          total: acc.total + i.total,
          atender: acc.atender + i.novedadesPorAtender,
          mayores: acc.mayores + i.mayores65,
        }),
        { docentes: 0, directivos: 0, administrativos: 0, total: 0, atender: 0, mayores: 0 }
      ),
    [filtradas]
  );

  const urlExportacion = `/api/exportar?tipo=instituciones${
    municipio ? `&municipio=${encodeURIComponent(municipio)}` : ""
  }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Instituciones</h1>
          <p className="text-xs text-slate-500">
            {filtradas.length.toLocaleString("es-CO")} instituciones con los
            filtros actuales
          </p>
        </div>
        <a
          href={urlExportacion}
          download
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Exportar Excel
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <TarjetaKPI etiqueta="Instituciones" valor={filtradas.length} />
        <TarjetaKPI etiqueta="Planta total" valor={totales.total} />
        <TarjetaKPI
          etiqueta="Docentes"
          valor={totales.docentes}
          detalle={`${totales.directivos} directivos · ${totales.administrativos} admin.`}
        />
        <TarjetaKPI
          etiqueta="Novedades por atender"
          valor={totales.atender}
          tono="amber"
        />
        <TarjetaKPI
          etiqueta="65 años o más"
          valor={totales.mayores}
          tono="rose"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={etiquetaCampo} htmlFor="q-inst">
              Buscar institución
            </label>
            <input
              id="q-inst"
              className={campo}
              placeholder="Nombre de la institución…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="mun">
              Municipio
            </label>
            <select
              id="mun"
              className={campo}
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
            >
              <option value="">Todos</option>
              {municipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[65vh] overflow-auto">
          <table className="tabla-base">
            <thead>
              <tr>
                <th>Municipio</th>
                <th>Institución</th>
                <th className="text-right">Docentes</th>
                <th className="text-right">Directivos</th>
                <th className="text-right">Admin.</th>
                <th className="text-right">Total</th>
                <th className="text-right">Propiedad</th>
                <th className="text-right">Prov. def.</th>
                <th className="text-right">Prov. temp.</th>
                <th className="text-right">Temp./PTA</th>
                <th className="text-right">Otros</th>
                <th className="text-right">Por atender</th>
                <th className="text-right">65+</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    Cargando instituciones…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    No hay instituciones con esos filtros.
                  </td>
                </tr>
              ) : (
                filtradas.map((i) => (
                  <tr key={`${i.municipio}-${i.institucion}`}>
                    <td className="whitespace-nowrap">{i.municipio}</td>
                    <td className="font-medium text-slate-800">
                      {i.institucion}
                    </td>
                    <td className="text-right tabular-nums">{i.docentes}</td>
                    <td className="text-right tabular-nums">{i.directivos}</td>
                    <td className="text-right tabular-nums">
                      {i.administrativos}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {i.total}
                    </td>
                    <td className="text-right tabular-nums">{i.propiedad}</td>
                    <td className="text-right tabular-nums">{i.provDefinitiva}</td>
                    <td className="text-right tabular-nums">{i.provTemporal}</td>
                    <td className="text-right tabular-nums">{i.temporalPTA}</td>
                    <td className="text-right tabular-nums">{i.otros}</td>
                    <td className="text-right tabular-nums">
                      {i.novedadesPorAtender > 0 ? (
                        <span className="font-bold text-amber-600">
                          {i.novedadesPorAtender}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="text-right tabular-nums">
                      {i.mayores65 > 0 ? (
                        <span className="font-semibold text-rose-600">
                          {i.mayores65}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!cargando && !error && filtradas.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={2} className="px-3 py-2 text-xs uppercase tracking-wide">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totales.docentes}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totales.directivos}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totales.administrativos}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totales.total}
                  </td>
                  <td colSpan={6} />
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totales.atender}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totales.mayores}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
