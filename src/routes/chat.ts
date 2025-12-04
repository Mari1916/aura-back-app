import { Router } from "express";
import { limparConversa } from "../controllers/chatController";
const { buscarMensagens } = require("../controllers/chatController");

const chatRouter = Router();

// Rota para buscar mensagens de uma conversa
chatRouter.get("/messages/:conversaId", buscarMensagens);

// Rota de exclusão de conversa
chatRouter.delete("/clear/:conversaId", limparConversa);

export default chatRouter;
