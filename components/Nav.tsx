"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/cliente";

const ENLACES = [
  { ruta: "/", etiqueta: "Dashboard" },
  { ruta: "/personas", etiqueta: "Planta" },
  { ruta: "/novedades", etiqueta: "Novedades" },
  { ruta: "/instituciones", etiqueta: "Instituciones" },
];

type UsuarioNav = { usuario: string; nombre: string; rol: string };

export default function Nav() {
  const ruta = usePathname();
  const router = useRouter();
  const [porAtender, setPorAtender] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<UsuarioNav | null>(null);

  useEffect(() => {
    if (ruta === "/login") return;
    let vigente = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vigente) setUsuario(d?.usuario ?? null);
      })
      .catch(() => {
        if (vigente) setUsuario(null);
      });
    api<{ total: number }>("/api/novedades?requiereAccion=1&porPagina=5")
      .then((r) => {
        if (vigente) setPorAtender(r.total);
      })
      .catch(() => setPorAtender(null));
    return () => {
      vigente = false;
    };
  }, [ruta]);

  if (ruta === "/login") return null;

  const enlaces =
    usuario?.rol === "admin"
      ? [...ENLACES, { ruta: "/usuarios", etiqueta: "Usuarios" }]
      : ENLACES;

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="bg-slate-900 text-white shadow">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-4">
        <div className="mr-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
            CP
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Control de planta</p>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              Secretaría de Educación de Risaralda
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {enlaces.map((e) => {
            const activo =
              e.ruta === "/" ? ruta === "/" : ruta.startsWith(e.ruta);
            return (
              <Link
                key={e.ruta}
                href={e.ruta}
                className={`relative rounded-md px-3 py-1.5 text-sm transition ${
                  activo
                    ? "bg-blue-600 font-medium text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {e.etiqueta}
                {e.ruta === "/novedades" &&
                  porAtender !== null &&
                  porAtender > 0 && (
                    <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                      {porAtender}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {usuario && (
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">
                {usuario.nombre || usuario.usuario}
              </p>
              <p className="text-[11px] text-slate-400">
                {usuario.rol === "admin" ? "Administrador" : "Usuario"}
              </p>
            </div>
          )}
          <button
            onClick={salir}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
