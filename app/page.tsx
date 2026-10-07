"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/cliente";
import type { Estadisticas } from "@/lib/types";
import {
  BarrasHorizontales,
  BarrasVerticales,
  Donut,
  Tarjeta,
  TarjetaKPI,
} from "@/components/Graficas";

const nf = (n: number) => n.toLocaleString("es-CO");

export default function Dashboard() {
  const [datos, setDatos] = useState<Estadisticas | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    api<Estadisticas>("/api/estadisticas")
      .then((d) => {
        if (activo) setDatos(d);
      })
      .catch((e: Error) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [version]);

  const recargar = () => {
    setCargando(true);
    setError("");
    setVersion((v) => v + 1);
  };

  if (cargando) {
    return (
      <p className="py-20 text-center text-sm text-slate-500">
        Cargando estadísticas…
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-medium text-rose-700">{error}</p>
        <button
          type="button"
          onClick={recargar}
          className="mt-3 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!datos) return null;

  const grupos = Object.entries(datos.porGrupo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Resumen de la planta
          </h1>
          <p className="text-xs text-slate-500">
            Datos al{" "}
            {datos.actualizado
              ? new Date(datos.actualizado).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={recargar}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <TarjetaKPI etiqueta="Total planta" valor={nf(datos.totalPersonas)} />
        <TarjetaKPI
          etiqueta="65 años o más"
          valor={nf(datos.mayores65)}
          detalle="Revisar retiro forzoso"
          tono="rose"
        />
        <TarjetaKPI
          etiqueta="Próximos a 65"
          valor={nf(datos.proximos65)}
          detalle="Cumplen en menos de 1 año"
          tono="amber"
        />
        <TarjetaKPI
          etiqueta="Vacante definitiva"
          valor={nf(datos.provisionalesVacanteDefinitiva)}
          detalle="Provisionales por cubrir"
          tono="blue"
        />
        <TarjetaKPI
          etiqueta="Novedades por atender"
          valor={nf(datos.novedadesPorAtender)}
          detalle={`De ${nf(datos.totalNovedades)} registradas`}
          tono="amber"
        />
        <TarjetaKPI
          etiqueta="Instituciones"
          valor={nf(datos.instituciones)}
          detalle={`En ${nf(datos.municipios)} municipios`}
          tono="slate"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tarjeta titulo="Distribución por grupo y viabilización (Dec. 1049/2025)">
          <table className="tabla-base">
            <thead>
              <tr>
                <th>Grupo</th>
                <th className="text-right">Registrados</th>
                <th className="text-right">Viabilizados</th>
                <th className="text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map(([grupo, total]) => (
                <tr key={grupo}>
                  <td className="font-medium text-slate-700">{grupo}</td>
                  <td className="text-right tabular-nums">{nf(total)}</td>
                  <td className="text-right tabular-nums">
                    {nf(datos.viabilizadas[grupo] ?? 0)}
                  </td>
                  <td
                    className={`text-right tabular-nums font-semibold ${
                      (datos.diferenciaViabilizacion[grupo] ?? 0) > 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {nf(datos.diferenciaViabilizacion[grupo] ?? 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="font-semibold">Total</td>
                <td className="text-right font-semibold tabular-nums">
                  {nf(datos.totalPersonas)}
                </td>
                <td className="text-right font-semibold tabular-nums">
                  {nf(
                    Object.values(datos.viabilizadas).reduce((s, v) => s + v, 0)
                  )}
                </td>
                <td className="text-right font-semibold tabular-nums">
                  {nf(
                    Object.values(datos.diferenciaViabilizacion).reduce(
                      (s, v) => s + v,
                      0
                    )
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Tarjeta>

        <Tarjeta titulo="Grupo">
          <Donut
            datos={grupos.map(([nombre, total]) => ({ nombre, total }))}
          />
        </Tarjeta>

        <Tarjeta titulo="Vinculación">
          <BarrasHorizontales datos={datos.porVinculacion} />
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Planta por municipio">
          <BarrasHorizontales
            datos={datos.porMunicipio.map((m) => ({
              nombre: m.nombre,
              total: m.total,
            }))}
          />
        </Tarjeta>

        <Tarjeta titulo="Distribución por edad">
          <BarrasVerticales datos={datos.porRangoEdad} />
          <p className="mt-3 text-center text-[11px] text-slate-400">
            {nf(datos.mayores65)} personas con 65 años o más ·{" "}
            {nf(datos.proximos65)} cumplen 65 en menos de un año
          </p>
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tarjeta titulo="Instituciones con más planta">
          <BarrasHorizontales
            datos={datos.porInstitucion.map((i) => ({
              nombre: i.institucion,
              total: i.total,
            }))}
          />
        </Tarjeta>

        <Tarjeta titulo="Novedades por estado">
          <BarrasHorizontales
            datos={datos.novedadesPorEstado.map((n) => ({
              nombre: n.estado,
              total: n.total,
            }))}
          />
        </Tarjeta>

        <Tarjeta titulo="Tipos de novedad">
          <BarrasHorizontales
            datos={datos.novedadesPorTipo.map((n) => ({
              nombre: n.tipo,
              total: n.total,
            }))}
          />
        </Tarjeta>
      </div>
    </div>
  );
}
