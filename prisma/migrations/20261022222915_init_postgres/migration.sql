-- CreateTable
CREATE TABLE "Persona" (
    "id" INTEGER NOT NULL,
    "municipio" TEXT NOT NULL DEFAULT '',
    "institucion" TEXT NOT NULL DEFAULT '',
    "sede" TEXT NOT NULL DEFAULT '',
    "grupo" TEXT NOT NULL DEFAULT '',
    "cargo" TEXT NOT NULL DEFAULT '',
    "nombre" TEXT NOT NULL DEFAULT '',
    "cedula" TEXT NOT NULL DEFAULT '',
    "vinculacion" TEXT NOT NULL DEFAULT '',
    "fechaNacimiento" TEXT NOT NULL DEFAULT '',
    "novedadAnterior" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "correo" TEXT NOT NULL DEFAULT '',
    "nivel" TEXT NOT NULL DEFAULT '',
    "area" TEXT NOT NULL DEFAULT '',
    "tipoInstitucion" TEXT NOT NULL DEFAULT '',
    "autoriza" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consecutivo" (
    "clave" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Consecutivo_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT '',
    "hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'usuario',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Novedad" (
    "id" TEXT NOT NULL,
    "personaId" INTEGER NOT NULL,
    "fechaRegistro" TEXT NOT NULL DEFAULT '',
    "tipo" TEXT NOT NULL DEFAULT '',
    "clase" TEXT NOT NULL DEFAULT '',
    "desde" TEXT,
    "hasta" TEXT,
    "dias" INTEGER,
    "necesidad" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "requiereAccion" BOOLEAN NOT NULL DEFAULT false,
    "observacion" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Novedad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Persona_grupo_idx" ON "Persona"("grupo");

-- CreateIndex
CREATE INDEX "Persona_municipio_idx" ON "Persona"("municipio");

-- CreateIndex
CREATE INDEX "Persona_institucion_idx" ON "Persona"("institucion");

-- CreateIndex
CREATE INDEX "Persona_vinculacion_idx" ON "Persona"("vinculacion");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");

-- CreateIndex
CREATE INDEX "Novedad_estado_idx" ON "Novedad"("estado");

-- CreateIndex
CREATE INDEX "Novedad_requiereAccion_idx" ON "Novedad"("requiereAccion");

-- CreateIndex
CREATE INDEX "Novedad_tipo_idx" ON "Novedad"("tipo");

-- AddForeignKey
ALTER TABLE "Novedad" ADD CONSTRAINT "Novedad_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;
