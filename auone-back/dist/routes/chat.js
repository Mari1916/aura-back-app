"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const chatRouter = (0, express_1.Router)();
// Apenas rota de exclusão de conversa
chatRouter.delete("/clear/:conversaId", chatController_1.limparConversa);
exports.default = chatRouter;
