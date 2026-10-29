"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DetallePersonaModal from "@/components/DetallePersonaModal";
import NovedadModal from "@/components/NovedadModal";
import PersonaModal from "@/components/PersonaModal";
import { generarActaPosesion } from "@/lib/actaPosesion";
import { generarCartaAceptacion } from "@/lib/cartaAceptacion";
import { generarCartaPresentacion } from "@/lib/cartaPresentacion";
import { api } from "@/lib/cliente";
import type {
  Catalogos,
  NovedadDTO,
  PersonaDTO,
  ResultadoPaginado,
} from "@/lib/types";

type Filtros = {
  q: string;
  municipio: string;
  institucion: string;
  grupo: string;
  vinculacion: string;
  alerta: string;
  conNovedad: string;
  orden: string;
  dir: string;
  pagina: number;
  porPagina: number;
};

const FILTROS_INICIALES: Filtros = {
  q: "",
  municipio: "",
  institucion: "",
  grupo: "",
  vinculacion: "",
  alerta: "",
  conNovedad: "",
  orden: "nombre",
  dir: "asc",
  pagina: 1,
  porPagina: 25,
};

const campo =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const etiquetaCampo = "mb-0.5 block text-[11px] font-medium text-slate-500";

function construirQuery(f: Filtros): string {
  const p = new URLSearchParams();
  const entradas: [string, string | number][] = [
    ["q", f.q],
    ["municipio", f.municipio],
    ["institucion", f.institucion],
    ["grupo", f.grupo],
    ["vinculacion", f.vinculacion],
    ["alerta", f.alerta],
    ["conNovedad", f.conNovedad],
    ["orden", f.orden],
    ["dir", f.dir],
    ["pagina", f.pagina],
    ["porPagina", f.porPagina],
  ];
  for (const [k, v] of entradas) {
    if (v !== "" && v !== 0) p.set(k, String(v));
  }
  return p.toString();
}

export default function PersonasPage() {
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [resultado, setResultado] = useState<ResultadoPaginado<PersonaDTO> | null>(
    null
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [editando, setEditando] = useState<PersonaDTO | null>(null);
  const [alta, setAlta] = useState(false);
  const [novedadDe, setNovedadDe] = useState<PersonaDTO | null>(null);
  const [generandoAp, setGenerandoAp] = useState<number | null>(null);
  const [generandoCa, setGenerandoCa] = useState<number | null>(null);
  const [generandoCp, setGenerandoCp] = useState<number | null>(null);

  useEffect(() => {
    api<Catalogos>("/api/catalogos").then(setCatalogos).catch(() => undefined);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const r = await api<ResultadoPaginado<PersonaDTO>>(
        `/api/personas?${construirQuery(filtros)}`
      );
      setResultado(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    const tiempo = filtros.q ? 350 : 0;
    const t = setTimeout(() => {
      void cargar();
    }, tiempo);
    return () => clearTimeout(t);
  }, [cargar, filtros.q]);

  const cambiarFiltro = (campo: keyof Filtros, valor: string | number) => {
    setFiltros((f) => ({
      ...f,
      [campo]: valor,
      ...(campo !== "pagina" ? { pagina: 1 } : {}),
    }));
  };

  const ordenarPor = (campoOrden: string) => {
    setFiltros((f) => ({
      ...f,
      orden: campoOrden,
      dir: f.orden === campoOrden && f.dir === "asc" ? "desc" : "asc",
      pagina: 1,
    }));
  };

  const indicadorOrden = (campoOrden: string) =>
    filtros.orden === campoOrden ? (filtros.dir === "asc" ? " ↑" : " ↓") : "";

  const urlExportacion = useMemo(
    () => `/api/exportar?tipo=personas&${construirQuery(filtros)}`,
    [filtros]
  );

  const query = resultado;
  const paginas = query?.paginas ?? 1;

  const cabeceras: [string, string][] = [
    ["nombre", "Nombre"],
    ["cedula", "Cédula"],
    ["grupo", "Grupo"],
    ["cargo", "Cargo"],
    ["municipio", "Municipio"],
    ["institucion", "Institución"],
    ["vinculacion", "Vinculación"],
    ["edad", "Edad"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Planta de personal</h1>
          <p className="text-xs text-slate-500">
            {query
              ? `${query.total.toLocaleString("es-CO")} personas con los filtros actuales`
              : "Cargando…"}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={urlExportacion}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            download
          >
            Exportar Excel
          </a>
          <button
            type="button"
            onClick={() => setAlta(true)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nueva persona
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="xl:col-span-2">
            <label className={etiquetaCampo} htmlFor="buscar">
              Buscar (nombre, cédula, cargo, sede)
            </label>
            <input
              id="buscar"
              className={campo}
              placeholder="Escriba para buscar…"
              value={filtros.q}
              onChange={(e) => cambiarFiltro("q", e.target.value)}
            />
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-municipio">
              Municipio
            </label>
            <select
              id="f-municipio"
              className={campo}
              value={filtros.municipio}
              onChange={(e) => cambiarFiltro("municipio", e.target.value)}
            >
              <option value="">Todos</option>
              {catalogos?.municipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-institucion">
              Institución
            </label>
            <select
              id="f-institucion"
              className={campo}
              value={filtros.institucion}
              onChange={(e) => cambiarFiltro("institucion", e.target.value)}
            >
              <option value="">Todas</option>
              {catalogos?.instituciones.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-grupo">
              Grupo
            </label>
            <select
              id="f-grupo"
              className={campo}
              value={filtros.grupo}
              onChange={(e) => cambiarFiltro("grupo", e.target.value)}
            >
              <option value="">Todos</option>
              {catalogos?.grupos.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-vinculacion">
              Vinculación
            </label>
            <select
              id="f-vinculacion"
              className={campo}
              value={filtros.vinculacion}
              onChange={(e) => cambiarFiltro("vinculacion", e.target.value)}
            >
              <option value="">Todas</option>
              {catalogos?.vinculaciones.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-alerta">
              Edad / novedades
            </label>
            <select
              id="f-alerta"
              className={campo}
              value={filtros.alerta || filtros.conNovedad}
              onChange={(e) => {
                const v = e.target.value;
                setFiltros((f) => ({
                  ...f,
                  alerta: v === "65" || v === "64" ? v : "",
                  conNovedad: v === "novedad" ? "1" : "",
                  pagina: 1,
                }));
              }}
            >
              <option value="">Todos</option>
              <option value="65">65 años o más</option>
              <option value="64">Cumplen 65 en 1 año</option>
              <option value="novedad">Con novedades</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[60vh] overflow-auto">
          <table className="tabla-base">
            <thead>
              <tr>
                {cabeceras.map(([campoOrden, titulo]) => (
                  <th key={campoOrden}>
                    <button
                      type="button"
                      onClick={() => ordenarPor(campoOrden)}
                      className="hover:text-blue-300"
                    >
                      {titulo}
                      {indicadorOrden(campoOrden)}
                    </button>
                  </th>
                ))}
                <th>Nvds.</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && !query ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Cargando personas…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : (query?.datos.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No se encontraron personas con esos filtros.
                  </td>
                </tr>
              ) : (
                query?.datos.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => setDetalleId(p.id)}
                  >
                    <td className="font-medium text-slate-800">
                      {p.nombre || (
                        <span className="italic text-slate-400">(sin nombre)</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap tabular-nums">{p.cedula}</td>
                    <td className="whitespace-nowrap">{p.grupo}</td>
                    <td>{p.cargo}</td>
                    <td className="whitespace-nowrap">{p.municipio}</td>
                    <td className="max-w-[16rem] truncate" title={p.institucion}>
                      {p.institucion}
                    </td>
                    <td className="whitespace-nowrap">{p.vinculacion}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {p.edad ?? "—"}
                      {p.alerta && (
                        <span
                          className="ml-1 font-bold text-rose-600"
                          title={p.alerta}
                        >
                          !
                        </span>
                      )}
                    </td>
                    <td className="text-center tabular-nums">
                      {p._count?.novedades ?? 0}
                    </td>
                     <td className="text-right" onClick={(e) => e.stopPropagation()}>
                       <button
                         type="button"
                         onClick={() => setDetalleId(p.id)}
                         className="mr-1 rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50"
                       >
                         Ver
                       </button>
                       <button
                         type="button"
                         disabled={generandoAp === p.id}
                         onClick={async () => {
                           setGenerandoAp(p.id);
                           try {
                             const { valor } = await api<{ valor: number }>(
                               "/api/consecutivos",
                               {
                                 method: "POST",
                                 body: JSON.stringify({ clave: "actaPosesion" }),
                               }
                             );
                             const detalle = await api<PersonaDTO>(`/api/personas/${p.id}`);
                             let elaboradoPor = null;
                             if (typeof window !== "undefined") {
                               const nombreElaboro = window.prompt("Nombre de quien elabora el acta:");
                               if (nombreElaboro && nombreElaboro.trim()) {
                                 elaboradoPor = nombreElaboro.trim();
                               }
                             }
                             await generarActaPosesion({
                               numero: valor,
                               nombre: detalle.nombre,
                               cedula: detalle.cedula,
                               municipio: detalle.municipio,
                               institucion: detalle.institucion,
                               cargo: detalle.cargo,
                               fechaNacimiento: detalle.fechaNacimiento,
                               datosExtra: detalle.datosExtra,
                               elaboradoPor,
                             });
                           } catch {
                             alert("No se pudo generar el Acta de Posesión");
                           } finally {
                             setGenerandoAp(null);
                           }
                         }}
                         className="mr-1 rounded border border-indigo-300 px-2 py-0.5 text-[11px] text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                       >
                         {generandoAp === p.id ? "Generando…" : "AP"}
                       </button>
                       <button
                         type="button"
                         disabled={generandoCa === p.id}
                         onClick={async () => {
                           setGenerandoCa(p.id);
                           try {
                             const detalle = await api<PersonaDTO>(`/api/personas/${p.id}`);
                             const grupo = (detalle.grupo || "").toUpperCase();
                             const vinculacion = (detalle.vinculacion || "").toUpperCase();
                             const cargoU = (detalle.cargo || "").toUpperCase();
                             const esDocente =
                               grupo.includes("DOC") ||
                               vinculacion.includes("DOC") ||
                               cargoU.includes("DOCENTE") ||
                               cargoU.includes("MAESTRO") ||
                               cargoU.includes("PROFESOR");
                             let profesionalRrhh = null;
                             if (typeof window !== "undefined") {
                               profesionalRrhh = window.localStorage.getItem("cp_profesional_rrhh");
                               if (!profesionalRrhh) {
                                 const nombreProfesional = window.prompt("Nombre del Profesional Universitario RRHH:");
                                 if (nombreProfesional && nombreProfesional.trim()) {
                                   profesionalRrhh = nombreProfesional.trim();
                                   window.localStorage.setItem("cp_profesional_rrhh", profesionalRrhh);
                                 }
                               }
                             }
                             await generarCartaAceptacion({
                               nombre: detalle.nombre,
                               cedula: detalle.cedula,
                               municipio: detalle.municipio,
                               institucion: detalle.institucion,
                               cargo: detalle.cargo,
                               grupo: detalle.grupo,
                               vinculacion: detalle.vinculacion,
                               datosExtra: detalle.datosExtra,
                               elaboradoPor: profesionalRrhh,
                               tipo: esDocente ? "DOCENTE" : "ADMINISTRATIVO",
                             });
                           } catch {
                             alert("No se pudo generar la Carta de Aceptación");
                           } finally {
                             setGenerandoCa(null);
                           }
                         }}
                         className="mr-1 rounded border border-emerald-300 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                       >
                         {generandoCa === p.id ? "Generando…" : "CA"}
                       </button>
                       <button
                         type="button"
                         disabled={generandoCp === p.id}
                         onClick={async () => {
                           setGenerandoCp(p.id);
                           try {
                             const detalle = await api<PersonaDTO>(`/api/personas/${p.id}`);
                             const grupo = (detalle.grupo || "").toUpperCase();
                             const vinculacion = (detalle.vinculacion || "").toUpperCase();
                             const cargoU = (detalle.cargo || "").toUpperCase();
                             const esDocente =
                               grupo.includes("DOC") ||
                               vinculacion.includes("DOC") ||
                               cargoU.includes("DOCENTE") ||
                               cargoU.includes("MAESTRO") ||
                               cargoU.includes("PROFESOR");
                             let elaboradoPor = null;
                             if (typeof window !== "undefined") {
                               const nombreElaboro = window.prompt("Nombre de quien elabora la carta de presentación:");
                               if (nombreElaboro && nombreElaboro.trim()) {
                                 elaboradoPor = nombreElaboro.trim();
                               }
                             }
                             await generarCartaPresentacion({
                               nombre: detalle.nombre,
                               cedula: detalle.cedula,
                               municipio: detalle.municipio,
                               institucion: detalle.institucion,
                               cargo: detalle.cargo,
                               grupo: detalle.grupo,
                               vinculacion: detalle.vinculacion,
                               datosExtra: detalle.datosExtra,
                               elaboradoPor,
                               tipo: esDocente ? "DOCENTE" : "ADMINISTRATIVO",
                             });
                           } catch {
                             alert("No se pudo generar la Carta de Presentación");
                           } finally {
                             setGenerandoCp(null);
                           }
                         }}
                         className="mr-1 rounded border border-amber-300 px-2 py-0.5 text-[11px] text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                       >
                         {generandoCp === p.id ? "Generando…" : "CP"}
                       </button>
                       <button
                         type="button"
                         onClick={() => setEditando(p)}
                         className="rounded border border-blue-300 px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-50"
                       >
                         Editar
                       </button>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {query
                ? `${query.total.toLocaleString("es-CO")} resultados`
                : "—"}
            </span>
            <select
              className="rounded border border-slate-300 px-1.5 py-1 text-xs"
              value={filtros.porPagina}
              onChange={(e) => cambiarFiltro("porPagina", Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              disabled={filtros.pagina <= 1 || cargando}
              onClick={() => cambiarFiltro("pagina", filtros.pagina - 1)}
              className="rounded border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="tabular-nums text-slate-600">
              Página {filtros.pagina} de {paginas}
            </span>
            <button
              type="button"
              disabled={filtros.pagina >= paginas || cargando}
              onClick={() => cambiarFiltro("pagina", filtros.pagina + 1)}
              className="rounded border border-slate-300 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {detalleId !== null && (
        <DetallePersonaModal
          personaId={detalleId}
          onCerrar={() => setDetalleId(null)}
          onEditar={(p) => {
            setDetalleId(null);
            setEditando(p);
          }}
          onNovedad={(p) => {
            setDetalleId(null);
            setNovedadDe(p);
          }}
        />
      )}

      {(editando || alta) && catalogos && (
        <PersonaModal
          persona={editando}
          catalogos={catalogos}
          onCerrar={() => {
            setEditando(null);
            setAlta(false);
          }}
          onGuardado={(p) => {
            setEditando(null);
            setAlta(false);
            void cargar();
            setDetalleId(p.id);
          }}
        />
      )}

       {novedadDe && catalogos && (
         <NovedadModal
           personaInicial={{
             id: novedadDe.id,
             nombre: novedadDe.nombre,
             cedula: novedadDe.cedula,
             municipio: novedadDe.municipio,
             institucion: novedadDe.institucion,
             cargo: novedadDe.cargo,
             grupo: novedadDe.grupo,
           }}
           catalogos={catalogos}
           onCerrar={() => setNovedadDe(null)}
           onGuardado={(n: NovedadDTO) => {
             setNovedadDe(null);
             void cargar();
             setDetalleId(n.personaId);
           }}
         />
       )}


     </div>
   );
 }
