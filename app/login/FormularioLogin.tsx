"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const campo =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const etiqueta = "mb-1 block text-xs font-medium text-slate-600";

export default function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), clave }),
      });
      const datos = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (datos as { error?: string }).error ?? "No se pudo iniciar sesión"
        );
      }
      const destino = params.get("destino");
      const redireccion =
        destino && destino.startsWith("/") && !destino.startsWith("//")
          ? destino
          : "/";
      router.replace(redireccion);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          CP
        </span>
        <div className="leading-tight">
          <h1 className="text-base font-semibold text-slate-800">
            Control de planta
          </h1>
          <p className="text-xs text-slate-500">
            Secretaría de Educación de Risaralda
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="usuario" className={etiqueta}>
            Usuario
          </label>
          <input
            id="usuario"
            className={campo}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </div>
        <div>
          <label htmlFor="clave" className={etiqueta}>
            Contraseña
          </label>
          <input
            id="clave"
            type="password"
            className={campo}
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-5 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
