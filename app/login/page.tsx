import { Suspense } from "react";
import FormularioLogin from "./FormularioLogin";

export const metadata = { title: "Iniciar sesión · Control de planta" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Suspense fallback={null}>
        <FormularioLogin />
      </Suspense>
    </div>
  );
}
