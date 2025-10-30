"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const dispositivos_1 = __importDefault(require("./routes/dispositivos"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
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
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
