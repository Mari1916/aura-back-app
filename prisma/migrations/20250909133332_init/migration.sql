-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Dispositivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dispositivo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DadoSensor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dispositivoId" TEXT NOT NULL,
    "umidadeSolo" REAL NOT NULL,
    "luminosidade" REAL NOT NULL,
    "temperaturaSolo" REAL NOT NULL,
    "temperaturaAr" REAL NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DadoSensor_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Dispositivo_deviceId_key" ON "Dispositivo"("deviceId");
