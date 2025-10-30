import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth";
import dispositivosRoutes from "./routes/dispositivos";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Quick runtime checks to fail fast when required env vars or DB are absent
const prismaHealth = new PrismaClient();

async function startupChecks() {
  if (!process.env.DATABASE_URL) {
    console.error("⚠️  Environment variable DATABASE_URL not set. Prisma requires DATABASE_URL to connect to the database.");
    process.exit(1);
  }

  try {
    // Try to connect to the database with retries
    let retries = 5;
    while (retries > 0) {
      try {
        await prismaHealth.$connect();
        console.log("✅ Database connection successful (startup check)");
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`Retrying database connection... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
      }
    }
  } catch (err) {
    console.error("❌ Failed to connect to the database during startup check:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prismaHealth.$disconnect();
  }
}

// ----------------- CORS -----------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ----------------- MIDDLEWARES -----------------
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// ----------------- ROTAS -----------------

console.log("Criando rota de perfil...")
app.use("/api/auth", authRoutes);
app.use("/api/dispositivo", dispositivosRoutes);


// Rota raiz
app.get("/", (req, res) => {
  res.json({ message: "🌿 API AUONE rodando com sucesso!" });
});

// Fallback 404
/* app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
}); */

// ----------------- INICIAR SERVIDOR -----------------
// Start server after startup checks
(async () => {
  await startupChecks();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
})();
