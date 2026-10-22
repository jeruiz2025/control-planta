import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth-servidor";
import UsuariosCliente from "./UsuariosCliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuarios · Control de planta" };

export default async function UsuariosPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "admin") redirect("/");
  return <UsuariosCliente usuarioActual={usuario} />;
}
