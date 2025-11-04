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
// If we're connecting to a hosted Postgres (e.g. Render) and the TLS
// certificate validation prevents the connection, disable TLS
// verification at runtime. This is a pragmatic workaround for some
// hosted providers that use certificates not trusted by the Node runtime.
// NOTE: disabling TLS verification is insecure for production use.
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')) {
    // Allow connecting even if the certificate cannot be verified
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
const prismaHealth = new client_1.PrismaClient({
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
        // show masked DB host in logs for debugging
        if (process.env.DATABASE_URL) {
            try {
                const m = process.env.DATABASE_URL.replace(/:\/\/([^:@]+):([^@]+)@/, '://<user>:<pass>@');
                console.log(`Conectando ao banco: ${m}`);
            }
            catch {
                // ignore masking errors
            }
        }
        while (retries > 0) {
            try {
                await prismaHealth.$connect();
                console.log("✅ A conexão foi um sucesso!!");
                break;
            }
            catch (error) {
                retries--;
                console.log(`Tentativa falhou, attempts left=${retries}. Erro:`, error instanceof Error ? error.message : String(error));
                if (retries === 0) {
                    // throw full error for outer catch to print
                    throw error;
                }
                console.log(`Tentando a conexão dnv (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
            }
        }
    }
    catch (err) {
        console.error("❌ Falhou a conexão:");
        // print full error object for better diagnostics in deployment logs
        console.error(err);
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
// Start server after startup checks
(async () => {
    await startupChecks();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
    });
})();
