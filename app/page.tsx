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
const dec = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : n.toLocaleString("es-CO", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

function DatoMini({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {etiqueta}
      </p>
      <p className="text-sm font-bold tabular-nums text-slate-800">{valor}</p>
    </div>
  );
}

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
  const anioBase = datos.ausentismo.anioActual;
  const retiros5 = datos.retiros.filter((r) => r.anio <= anioBase + 4);
  const retiros10 = datos.retiros.filter((r) => r.anio < anioBase + 10);
  const retirosDespues = datos.retiros
    .filter((r) => r.anio >= anioBase + 10)
    .reduce((s, r) => s + r.total, 0);

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <TarjetaKPI
          etiqueta="Puestos por proveer"
          valor={nf(datos.vacantes.total)}
          detalle={`${nf(datos.vacantes.definitivas)} definitivas · ${nf(datos.vacantes.temporales)} temporales`}
          tono="blue"
        />
        <TarjetaKPI
          etiqueta="Retiros a 5 años"
          valor={nf(retiros5.reduce((s, r) => s + r.total, 0))}
          detalle={`${anioBase}–${anioBase + 4} · cumplen 65 años`}
          tono="rose"
        />
        <TarjetaKPI
          etiqueta="Edad promedio"
          valor={dec(datos.perfilEdad.promedio)}
          detalle={`Mediana ${dec(datos.perfilEdad.mediana)} años`}
          tono="slate"
        />
        <TarjetaKPI
          etiqueta="Mayores de 55"
          valor={`${dec(datos.perfilEdad.pct55)}%`}
          detalle={`${dec(datos.perfilEdad.pct60)}% tiene 60 o más`}
          tono="amber"
        />
        <TarjetaKPI
          etiqueta={`Ausentismo ${datos.ausentismo.anioActual}`}
          valor={`${nf(datos.ausentismo.diasActuales)} d`}
          detalle={
            datos.ausentismo.dias === 0
              ? "Sin ausencias registradas"
              : `Histórico ${nf(datos.ausentismo.dias)} d · índice ${dec(datos.ausentismo.indiceAnual)}%`
          }
          tono="amber"
        />
        <TarjetaKPI
          etiqueta="Datos a corregir"
          valor={nf(datos.calidadDatos.incompletos)}
          detalle={`${dec(datos.calidadDatos.pctCompleto)}% de registros confiables`}
          tono="rose"
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tarjeta titulo="Puestos por proveer">
          <table className="tabla-base">
            <thead>
              <tr>
                <th>Grupo</th>
                <th className="text-right">Vacantes</th>
              </tr>
            </thead>
            <tbody>
              {datos.vacantes.porGrupo.map((g) => (
                <tr key={g.nombre}>
                  <td className="font-medium text-slate-700">{g.nombre}</td>
                  <td className="text-right tabular-nums">{nf(g.total)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="font-semibold">Total</td>
                <td className="text-right font-semibold tabular-nums">
                  {nf(datos.vacantes.total)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Por municipio
            </p>
            <BarrasHorizontales datos={datos.vacantes.porMunicipio} />
          </div>
        </Tarjeta>

        <Tarjeta titulo="Proyección de retiros (cumplen 65)">
          <BarrasVerticales
            datos={retiros10.map((r) => ({
              rango: String(r.anio),
              total: r.total,
            }))}
          />
          <p className="mt-3 text-center text-[11px] text-slate-400">
            {datos.retiros.length === 0
              ? "Sin próximos cumpleaños de 65 años"
              : `${nf(retiros10.reduce((s, r) => s + r.total, 0))} personas cumplirán 65 entre ${anioBase} y ${anioBase + 9}${
                  retirosDespues > 0
                    ? ` · ${nf(retirosDespues)} después de ${anioBase + 9}`
                    : ""
                }`}
          </p>
        </Tarjeta>

        <Tarjeta titulo="Perfil de edad">
          <div className="grid grid-cols-2 gap-2">
            <DatoMini
              etiqueta="Promedio"
              valor={`${dec(datos.perfilEdad.promedio)} años`}
            />
            <DatoMini
              etiqueta="Mediana"
              valor={`${dec(datos.perfilEdad.mediana)} años`}
            />
            <DatoMini
              etiqueta="Mayores de 55"
              valor={`${dec(datos.perfilEdad.pct55)}%`}
            />
            <DatoMini
              etiqueta="Mayores de 60"
              valor={`${dec(datos.perfilEdad.pct60)}%`}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Base: {nf(datos.perfilEdad.base)} personas con fecha de nacimiento
          </p>
          <div className="mt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Promedio por grupo
            </p>
            <BarrasHorizontales
              datos={datos.perfilEdad.porGrupo}
              sufijo=" años"
            />
          </div>
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tarjeta titulo="Ausentismo (licencias, incapacidades y permisos)">
          {datos.ausentismo.diasPorAnio.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Sin ausencias registradas
            </p>
          ) : (
            <BarrasVerticales
              datos={datos.ausentismo.diasPorAnio.map((d) => ({
                rango: d.nombre,
                total: d.total,
              }))}
            />
          )}
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Histórico: {nf(datos.ausentismo.dias)} días · índice{" "}
            {datos.ausentismo.anioActual}:{" "}
            {dec(datos.ausentismo.indiceAnual)}%
          </p>
          {datos.ausentismo.topInstituciones.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Más días perdidos
              </p>
              <BarrasHorizontales
                datos={datos.ausentismo.topInstituciones}
                sufijo=" d"
              />
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Gestión de novedades">
          {datos.gestionNovedades.total === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Aún no hay novedades registradas
            </p>
          ) : (
            <table className="tabla-base">
              <tbody>
                <tr>
                  <td className="font-medium text-slate-700">Registradas</td>
                  <td className="text-right tabular-nums">
                    {nf(datos.gestionNovedades.total)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-slate-700">
                    Pendientes (Pendiente + En trámite)
                  </td>
                  <td className="text-right font-semibold tabular-nums text-amber-600">
                    {nf(datos.gestionNovedades.pendientes)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-slate-700">Cubiertas</td>
                  <td className="text-right tabular-nums text-emerald-600">
                    {nf(datos.gestionNovedades.cubiertas)} (
                    {nf(datos.gestionNovedades.pctCubiertas)}%)
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-slate-700">
                    Tiempo promedio pendiente
                  </td>
                  <td className="text-right tabular-nums">
                    {datos.gestionNovedades.diasPromedioPendiente === null
                      ? "—"
                      : `${nf(datos.gestionNovedades.diasPromedioPendiente)} días`}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-slate-700">
                    Tipo más frecuente
                  </td>
                  <td className="text-right">
                    {datos.gestionNovedades.tipoMasFrecuente ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </Tarjeta>

        <Tarjeta titulo="Instituciones con más presión (vacantes + novedades por atender)">
          {datos.topProblemas.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Sin datos
            </p>
          ) : (
            <table className="tabla-base">
              <thead>
                <tr>
                  <th>Institución</th>
                  <th className="text-right">Vacantes</th>
                  <th className="text-right">Noved.</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {datos.topProblemas.map((t) => (
                  <tr key={`${t.municipio}-${t.institucion}`}>
                    <td>
                      <p className="font-medium text-slate-700">
                        {t.institucion}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {t.municipio}
                      </p>
                    </td>
                    <td className="text-right tabular-nums">
                      {nf(t.vacantes)}
                    </td>
                    <td className="text-right tabular-nums">
                      {nf(t.novedades)}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {nf(t.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Edad promedio por municipio">
          <BarrasHorizontales
            datos={datos.perfilEdad.porMunicipio}
            sufijo=" años"
          />
        </Tarjeta>

        <Tarjeta titulo="Calidad del dato">
          <table className="tabla-base">
            <tbody>
              <tr>
                <td className="font-medium text-slate-700">
                  Sin fecha de nacimiento
                </td>
                <td className="text-right tabular-nums">
                  {nf(datos.calidadDatos.sinFechaNacimiento)}
                </td>
              </tr>
              <tr>
                <td className="font-medium text-slate-700">Sin cédula</td>
                <td className="text-right tabular-nums">
                  {nf(datos.calidadDatos.sinCedula)}
                </td>
              </tr>
              <tr>
                <td className="font-medium text-slate-700">
                  Fecha imposible (menores de 15 años)
                </td>
                <td className="text-right tabular-nums">
                  {nf(datos.calidadDatos.imposibles)}
                </td>
              </tr>
              <tr>
                <td className="font-medium text-slate-700">
                  Registros incompletos
                </td>
                <td className="text-right font-semibold tabular-nums text-rose-600">
                  {nf(datos.calidadDatos.incompletos)}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="font-semibold">Registros completos</td>
                <td className="text-right font-semibold tabular-nums text-emerald-600">
                  {dec(datos.calidadDatos.pctCompleto)}%
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${Math.max(2, datos.calidadDatos.pctCompleto)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Cédula válida y fecha de nacimiento confiable en la misma fila
          </p>
        </Tarjeta>
      </div>
    </div>
  );
}
