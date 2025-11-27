import { Router } from "express";
import { limparConversa } from "../controllers/chatController";

const chatRouter = Router();

// Apenas rota de exclusão de conversa
chatRouter.delete("/clear/:conversaId", limparConversa);

export default chatRouter;