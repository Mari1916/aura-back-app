import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import dispositivosRoutes from "./routes/dispositivos";
import sensoresRoutes from "./routes/sensores";
import usuariosRoutes from "./routes/usuario";
import perfilRoutes from "./routes/perfil";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CORS GLOBAL ====================
// Permite todas as origens, todos métodos e headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // responde preflight imediatamente
  }
  next();
});

// Também adiciona o middleware cors oficial (boa prática)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ==================== MIDDLEWARES ====================
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// ==================== ROTAS ====================
app.use("/api/auth", authRoutes);
app.use("/api/dispositivos", dispositivosRoutes);
app.use("/api/sensores", sensoresRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/perfil", perfilRoutes);

// Rota raiz
app.get("/", (req, res) => {
  res.json({ message: "🌿 API AUONE rodando com sucesso!" });
});

// ==================== START DO SERVIDOR ====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
