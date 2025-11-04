import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth";
import dispositivosRoutes from "./routes/dispositivos";
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

console.log(`Iniciando servidor na porta ${PORT}...`);

// Quick runtime checks to fail fast when required env vars or DB are absent
// If we're connecting to a hosted Postgres (e.g. Render) and the TLS
// certificate validation prevents the connection, disable TLS
// verification at runtime. This is a pragmatic workaround for some
// hosted providers that use certificates not trusted by the Node runtime.
// NOTE: disabling TLS verification is insecure for production use.
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')) {
  // Allow connecting even if the certificate cannot be verified
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const prismaHealth = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

async function startupChecks() {
  if (!process.env.DATABASE_URL) {
    console.error("⚠️  Environment variable DATABASE_URL not set. Prisma requires DATABASE_URL to connect to the database.");
    process.exit(1);
  }

  try {
    // Tentar a conexão com o banco de dados a td custo
    let retries = 5;
    while (retries > 0) {
      try {
        await prismaHealth.$connect();
        console.log("✅ A conexão foi um sucesso!!");
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`Tentando a conexão dnv (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
      }
    }
  } catch (err) {
    console.error("❌ Falhou a conexão:", err instanceof Error ? err.message : String(err));
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  });
})();
