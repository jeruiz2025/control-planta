"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NovedadModal from "@/components/NovedadModal";
import { api } from "@/lib/cliente";
import type {
  Catalogos,
  NovedadDTO,
  ResultadoPaginado,
} from "@/lib/types";

const campo =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const etiquetaCampo = "mb-0.5 block text-[11px] font-medium text-slate-500";

type Filtros = {
  q: string;
  estado: string;
  tipo: string;
  requiereAccion: string;
  pagina: number;
  porPagina: number;
};

const FILTROS_INICIALES: Filtros = {
  q: "",
  estado: "",
  tipo: "",
  requiereAccion: "",
  pagina: 1,
  porPagina: 25,
};

function construirQuery(f: Filtros, personaId?: string): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.estado) p.set("estado", f.estado);
  if (f.tipo) p.set("tipo", f.tipo);
  if (f.requiereAccion) p.set("requiereAccion", f.requiereAccion);
  if (personaId) p.set("personaId", personaId);
  p.set("pagina", String(f.pagina));
  p.set("porPagina", String(f.porPagina));
  return p.toString();
}

function Estado({ estado }: { estado: string }) {
  const tonos: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-800",
    "En trámite": "bg-sky-100 text-sky-800",
    Cubierta: "bg-emerald-100 text-emerald-800",
    "No requiere": "bg-slate-200 text-slate-600",
  };
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        tonos[estado] ?? "bg-slate-200 text-slate-600"
      }`}
    >
      {estado}
    </span>
  );
}

export default function NovedadesPage() {
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-slate-500">
          Cargando novedades…
        </p>
      }
    >
      <ContenidoNovedades />
    </Suspense>
  );
}

function ContenidoNovedades() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const personaId = searchParams.get("personaId") ?? "";
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [resultado, setResultado] = useState<
    ResultadoPaginado<NovedadDTO> | null
  >(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{
    novedad?: NovedadDTO | null;
  } | null>(null);

  useEffect(() => {
    api<Catalogos>("/api/catalogos").then(setCatalogos).catch(() => undefined);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const r = await api<ResultadoPaginado<NovedadDTO>>(
        `/api/novedades?${construirQuery(filtros, personaId)}`
      );
      setResultado(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [filtros, personaId]);

  useEffect(() => {
    const tiempo = filtros.q ? 350 : 0;
    const t = setTimeout(() => {
      void cargar();
    }, tiempo);
    return () => clearTimeout(t);
  }, [cargar, filtros.q]);

  const cambiarFiltro = (campoFiltro: keyof Filtros, valor: string | number) => {
    setFiltros((f) => ({
      ...f,
      [campoFiltro]: valor,
      ...(campoFiltro !== "pagina" ? { pagina: 1 } : {}),
    }));
  };

  const eliminar = async (n: NovedadDTO) => {
    if (!window.confirm(`¿Eliminar la novedad "${n.tipo}" de ${n.persona?.nombre ?? ""}?`)) {
      return;
    }
    try {
      await api(`/api/novedades/${n.id}`, { method: "DELETE" });
      void cargar();
    } catch (e) {
      window.alert((e as Error).message);
    }
  };

  const urlExportacion = useMemo(
    () => `/api/exportar?tipo=novedades&${construirQuery(filtros, personaId)}`,
    [filtros, personaId]
  );

  const paginas = resultado?.paginas ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Novedades</h1>
          <p className="text-xs text-slate-500">
            {resultado
              ? `${resultado.total.toLocaleString("es-CO")} novedades con los filtros actuales`
              : "Cargando…"}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={urlExportacion}
            download
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Exportar Excel
          </a>
          <button
            type="button"
            onClick={() => setModal({})}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Registrar novedad
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className={etiquetaCampo} htmlFor="buscar-nv">
              Buscar (nombre, cédula, institución)
            </label>
            <input
              id="buscar-nv"
              className={campo}
              placeholder="Escriba para buscar…"
              value={filtros.q}
              onChange={(e) => cambiarFiltro("q", e.target.value)}
            />
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-tipo">
              Tipo de novedad
            </label>
            <select
              id="f-tipo"
              className={campo}
              value={filtros.tipo}
              onChange={(e) => cambiarFiltro("tipo", e.target.value)}
            >
              <option value="">Todos</option>
              {catalogos?.tiposNovedad.map((t) => (
                <option key={t.tipo} value={t.tipo}>
                  {t.tipo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-estado">
              Estado
            </label>
            <select
              id="f-estado"
              className={campo}
              value={filtros.estado}
              onChange={(e) => cambiarFiltro("estado", e.target.value)}
            >
              <option value="">Todos</option>
              {catalogos?.estados.map((e2) => (
                <option key={e2} value={e2}>
                  {e2}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={etiquetaCampo} htmlFor="f-accion">
              Requiere acción
            </label>
            <select
              id="f-accion"
              className={campo}
              value={filtros.requiereAccion}
              onChange={(e) => cambiarFiltro("requiereAccion", e.target.value)}
            >
              <option value="">Todas</option>
              <option value="1">Sólo las que requieren acción</option>
              <option value="0">Las que no requieren</option>
            </select>
          </div>
        </div>
        {personaId && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700">
              Filtrando por una sola persona
            </span>
            <button
              type="button"
              onClick={() => router.replace("/novedades")}
              className="underline hover:text-slate-800"
            >
              Quitar filtro
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[60vh] overflow-auto">
          <table className="tabla-base">
            <thead>
              <tr>
                <th>Registro</th>
                <th>Persona</th>
                <th>Tipo</th>
                <th>Clase</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th className="text-right">Días</th>
                <th>Necesidad detectada</th>
                <th>Estado</th>
                <th>Acción</th>
                <th className="text-right">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && !resultado ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Cargando novedades…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : (resultado?.datos.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    No hay novedades registradas con esos filtros.
                  </td>
                </tr>
              ) : (
                resultado?.datos.map((n) => (
                  <tr key={n.id} className="cursor-pointer" onClick={() => setModal({ novedad: n })}>
                    <td className="whitespace-nowrap">{n.fechaRegistro}</td>
                    <td>
                      <p className="font-medium text-slate-800">
                        {n.persona?.nombre || "(sin nombre)"}
                      </p>
                      <p className="text-[11px] tabular-nums text-slate-400">
                        {n.persona?.cedula} · {n.persona?.institucion}
                      </p>
                    </td>
                    <td className="whitespace-nowrap">{n.tipo}</td>
                    <td className="text-center font-semibold">{n.clase}</td>
                    <td className="whitespace-nowrap">{n.desde ?? "—"}</td>
                    <td className="whitespace-nowrap">{n.hasta ?? "—"}</td>
                    <td className="text-right tabular-nums">{n.dias ?? "—"}</td>
                    <td>{n.necesidad || "—"}</td>
                    <td>
                      <Estado estado={n.estado} />
                    </td>
                    <td>
                      {n.requiereAccion ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
                          SÍ
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setModal({ novedad: n })}
                        className="mr-1 rounded border border-blue-300 px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(n)}
                        className="rounded border border-rose-300 px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50"
                      >
                        Borrar
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
              {resultado
                ? `${resultado.total.toLocaleString("es-CO")} resultados`
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

      {modal && catalogos && (
        <NovedadModal
          novedad={modal.novedad ?? null}
          catalogos={catalogos}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            void cargar();
          }}
        />
      )}
    </div>
  );
}
