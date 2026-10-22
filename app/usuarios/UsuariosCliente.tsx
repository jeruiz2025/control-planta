"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/cliente";
import type { UsuarioSesion } from "@/lib/auth-servidor";

type Usuario = {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
  activo: boolean;
  createdAt: string;
};

const campo =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const etiquetaCampo = "mb-0.5 block text-[11px] font-medium text-slate-500";

const VACIO = {
  usuario: "",
  nombre: "",
  clave: "",
  rol: "usuario",
  activo: true,
};

export default function UsuariosCliente({
  usuarioActual,
}: {
  usuarioActual: UsuarioSesion;
}) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      setError("");
      const datos = await api<Usuario[]>("/api/usuarios");
      setUsuarios(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let vigente = true;
    api<Usuario[]>("/api/usuarios")
      .then((datos) => {
        if (vigente) setUsuarios(datos);
      })
      .catch((e) => {
        if (vigente) {
          setError(e instanceof Error ? e.message : "Error al cargar usuarios");
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  function nuevo() {
    setEditando(null);
    setForm(VACIO);
    setError("");
    setAviso("");
  }

  function editar(u: Usuario) {
    setEditando(u);
    setForm({
      usuario: u.usuario,
      nombre: u.nombre,
      clave: "",
      rol: u.rol,
      activo: u.activo,
    });
    setError("");
    setAviso("");
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAviso("");
    setGuardando(true);
    try {
      if (editando) {
        await api<Usuario>(`/api/usuarios/${editando.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nombre: form.nombre,
            rol: form.rol,
            activo: form.activo,
            ...(form.clave ? { clave: form.clave } : {}),
          }),
        });
        setAviso("Usuario actualizado");
      } else {
        await api<Usuario>("/api/usuarios", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setAviso("Usuario creado");
      }
      nuevo();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(u: Usuario) {
    if (!window.confirm(`¿Eliminar el usuario "${u.usuario}"?`)) return;
    setError("");
    setAviso("");
    try {
      await api<{ ok: boolean }>(`/api/usuarios/${u.id}`, { method: "DELETE" });
      if (editando?.id === u.id) nuevo();
      setAviso("Usuario eliminado");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Usuarios</h1>
        <p className="text-xs text-slate-500">
          Administra quién puede ingresar al sistema y con qué rol.
        </p>
      </div>

      <form
        onSubmit={guardar}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            {editando ? `Editar usuario: ${editando.usuario}` : "Nuevo usuario"}
          </h2>
          {editando && (
            <button
              type="button"
              onClick={nuevo}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className={etiquetaCampo}>Usuario</label>
            <input
              className={campo}
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              disabled={!!editando}
              required
            />
          </div>
          <div>
            <label className={etiquetaCampo}>Nombre</label>
            <input
              className={campo}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className={etiquetaCampo}>
              {editando ? "Nueva contraseña (opcional)" : "Contraseña"}
            </label>
            <input
              type="password"
              className={campo}
              value={form.clave}
              onChange={(e) => setForm({ ...form, clave: e.target.value })}
              autoComplete="new-password"
              required={!editando}
            />
          </div>
          <div>
            <label className={etiquetaCampo}>Rol</label>
            <select
              className={campo}
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Activo
            </label>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? "Guardando…" : editando ? "Actualizar" : "Crear"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {aviso && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {aviso}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {u.usuario}
                    {u.id === usuarioActual.id && (
                      <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        tú
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{u.nombre || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {u.rol === "admin" ? "Administrador" : "Usuario"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.activo
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => editar(u)}
                      className="mr-2 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(u)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
