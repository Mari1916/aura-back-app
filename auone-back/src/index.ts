import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Necessário para que req.body funcione com JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Rotas
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ mensagem: "🌿 API AUONE rodando com sucesso!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
