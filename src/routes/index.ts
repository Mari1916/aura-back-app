// routes/index.ts
import { Express } from "express";
import authRoutes from "./auth";
import dispositivosRoutes from "./dispositivos";
import sensoresRoutes from "./sensores";
import chatRoutes from "./chatService";

export const setupRoutes = (app: Express) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/dispositivo", dispositivosRoutes);
  app.use("/api/sensores", sensoresRoutes);
  app.use("/api/chat", chatRoutes);

  app.get("/", (req, res) => {
    res.json({ message: "🌿 API AUONE rodando com sucesso!" });
  });
};
