"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./routes/auth"));
const dispositivos_1 = __importDefault(require("./routes/dispositivos"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
console.log(`Iniciando servidor na porta ${PORT}...`);
// Quick runtime checks to fail fast when required env vars or DB are absent
const prismaHealth = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
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
            }
            catch (error) {
                retries--;
                if (retries === 0) {
                    throw error;
                }
                console.log(`Tentando a conexão dnv (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
            }
        }
    }
    catch (err) {
        console.error("❌ Falhou a conexão:", err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
    finally {
        await prismaHealth.$disconnect();
    }
}
// ----------------- CORS -----------------
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// ----------------- MIDDLEWARES -----------------
app.use(express_1.default.json({ limit: "20mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// ----------------- ROTAS -----------------
console.log("Criando rota de perfil...");
app.use("/api/auth", auth_1.default);
app.use("/api/dispositivo", dispositivos_1.default);
// Rota raiz
app.get("/", (req, res) => {
    res.json({ message: "🌿 API AUONE rodando com sucesso!" });
});
// Fallback 404
/* app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
}); */
// ----------------- INICIAR SERVIDOR -----------------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
});
// Start server after startup checks
(async () => {
    await startupChecks();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
})();
