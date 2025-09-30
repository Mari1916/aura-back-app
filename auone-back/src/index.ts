import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth"; // rotas de auth
import dispositivosRoutes from "./routes/dispositivos";
import sensoresRoutes from "./routes/sensores";
import usuariosRoutes from "./routes/usuario";
import perfilRoutes from "./routes/perfil";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIGURAÇÃO CORS ====================
app.use(cors({
  origin: "*", // permite todas as origens (pode ser restrito em produção)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ==================== MIDDLEWARES ====================
app.use(express.json({ limit: "20mb" })); // aceita JSON grande
app.use(express.urlencoded({ extended: true }));

// ==================== ROTAS ====================
app.use("/api/auth", authRoutes);
app.use("/api/dispositivos", dispositivosRoutes);
app.use("/api/sensores", sensoresRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/perfil", perfilRoutes); // corrigi para ter prefixo consistente

// Rota raiz
app.get("/", (req, res) => {
  res.json({ message: "🌿 API AUONE rodando com sucesso!" });
});

// ==================== START DO SERVIDOR ====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
