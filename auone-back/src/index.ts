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

// Configurações CORS (funciona para web e mobile)
app.use(cors({
  origin: "*", // permite todas as origens
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware para JSON
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/dispositivos", dispositivosRoutes);
app.use("/api/sensores", sensoresRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use(perfilRoutes);

// Rota raiz
app.get("/", (req, res) => {
  res.json({ message: "🌿 API AUONE rodando com sucesso!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});