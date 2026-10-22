import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/session";

const PUBLICAS = ["/login", "/api/auth/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sesion = verificarToken(request.cookies.get(COOKIE_SESION)?.value);

  const esPublica = PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );

  if (esPublica) {
    if (sesion && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!sesion) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("destino", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|woff2?|ttf)$).*)",
  ],
};
