import { Router } from "express";
import { enviarMensagemChat, limparConversa } from "../controllers/chatController";

const chatRouter = Router();

chatRouter.post("/message", enviarMensagemChat);
chatRouter.delete("/clear/:conversaId", limparConversa);

export default chatRouter;
