"use client";

import type { ReactNode } from "react";

export const COLORES = [
  "#2563eb",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#64748b",
];

export function Tarjeta({
  titulo,
  children,
  accion,
}: {
  titulo: string;
  children: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex min-h-[1.5rem] items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
        {accion}
      </div>
      {children}
    </section>
  );
}

const TONOS: Record<string, string> = {
  blue: "text-blue-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
  emerald: "text-emerald-600",
  slate: "text-slate-600",
};

export function TarjetaKPI({
  etiqueta,
  valor,
  detalle,
  tono = "blue",
}: {
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  tono?: keyof typeof TONOS;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{valor}</p>
      {detalle && (
        <p className={`mt-1 text-xs font-medium ${TONOS[tono]}`}>{detalle}</p>
      )}
    </div>
  );
}

export function BarrasHorizontales({
  datos,
  sufijo = "",
}: {
  datos: { nombre: string; total: number }[];
  sufijo?: string;
}) {
  if (datos.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">Sin datos</p>;
  }
  const maximo = Math.max(...datos.map((d) => d.total), 1);
  return (
    <ul className="space-y-2">
      {datos.map((d, i) => (
        <li key={d.nombre} className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div>
            <p className="truncate text-xs text-slate-600" title={d.nombre}>
              {d.nombre || "(sin dato)"}
            </p>
            <div className="mt-0.5 h-2.5 w-full rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: `${Math.max(2, (d.total / maximo) * 100)}%`,
                  backgroundColor: COLORES[i % COLORES.length],
                }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-700">
            {d.total.toLocaleString("es-CO")}
            {sufijo}
          </span>
        </li>
      ))}
    </ul>
  );
}

function construirSegmentos(
  datos: { nombre: string; total: number }[],
  total: number
): string[] {
  let acumulado = 0;
  return datos.map((d, i) => {
    const inicio = acumulado;
    acumulado += (d.total / total) * 100;
    return `${COLORES[i % COLORES.length]} ${inicio.toFixed(2)}% ${acumulado.toFixed(2)}%`;
  });
}

export function Donut({ datos }: { datos: { nombre: string; total: number }[] }) {
  const total = datos.reduce((s, d) => s + d.total, 0);
  if (total === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">Sin datos</p>;
  }
  const segmentos = construirSegmentos(datos, total);

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${segmentos.join(", ")})` }}
      >
        <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-xl font-bold text-slate-900">
            {total.toLocaleString("es-CO")}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            total
          </span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {datos.map((d, i) => (
          <li key={d.nombre} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORES[i % COLORES.length] }}
            />
            <span className="text-slate-600">{d.nombre || "(sin dato)"}</span>
            <span className="font-semibold tabular-nums text-slate-800">
              {d.total.toLocaleString("es-CO")}
            </span>
            <span className="text-slate-400">
              ({((d.total / total) * 100).toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarrasVerticales({
  datos,
}: {
  datos: { rango: string; total: number }[];
}) {
  if (datos.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">Sin datos</p>;
  }
  const maximo = Math.max(...datos.map((d) => d.total), 1);
  return (
    <div className="flex h-44 items-end gap-1.5">
      {datos.map((d) => (
        <div key={d.rango} className="flex h-full flex-1 flex-col justify-end">
          <span className="mb-0.5 text-center text-[10px] font-semibold tabular-nums text-slate-600">
            {d.total.toLocaleString("es-CO")}
          </span>
          <div
            className="w-full rounded-t bg-sky-500"
            style={{
              height: `${Math.max(3, (d.total / maximo) * 78)}%`,
            }}
            title={`${d.rango}: ${d.total}`}
          />
          <span className="mt-1 text-center text-[9px] leading-tight text-slate-500">
            {d.rango}
          </span>
        </div>
      ))}
    </div>
  );
}
