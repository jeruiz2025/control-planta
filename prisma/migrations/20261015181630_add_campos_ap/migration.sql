-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Persona" (
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
    "direccion" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "correo" TEXT NOT NULL DEFAULT '',
    "nivel" TEXT NOT NULL DEFAULT '',
    "area" TEXT NOT NULL DEFAULT '',
    "tipoInstitucion" TEXT NOT NULL DEFAULT '',
    "autoriza" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Persona" ("cargo", "cedula", "fechaNacimiento", "grupo", "id", "institucion", "municipio", "nombre", "novedadAnterior", "sede", "updatedAt", "vinculacion") SELECT "cargo", "cedula", "fechaNacimiento", "grupo", "id", "institucion", "municipio", "nombre", "novedadAnterior", "sede", "updatedAt", "vinculacion" FROM "Persona";
DROP TABLE "Persona";
ALTER TABLE "new_Persona" RENAME TO "Persona";
CREATE INDEX "Persona_grupo_idx" ON "Persona"("grupo");
CREATE INDEX "Persona_municipio_idx" ON "Persona"("municipio");
CREATE INDEX "Persona_institucion_idx" ON "Persona"("institucion");
CREATE INDEX "Persona_vinculacion_idx" ON "Persona"("vinculacion");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
