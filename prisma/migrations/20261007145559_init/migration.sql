-- CreateTable
CREATE TABLE "Persona" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Novedad" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Novedad_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE INDEX "Novedad_estado_idx" ON "Novedad"("estado");

-- CreateIndex
CREATE INDEX "Novedad_requiereAccion_idx" ON "Novedad"("requiereAccion");

-- CreateIndex
CREATE INDEX "Novedad_tipo_idx" ON "Novedad"("tipo");
