"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limparConversa = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const limparConversa = async (req, res) => {
    const { conversaId } = req.params;
    try {
        await prisma.conversa.delete({
            where: { id: conversaId }
        });
        return res.json({
            message: "Conversa e histórico excluídos com sucesso.",
            conversaId
        });
    }
    catch (error) {
        console.error("Erro ao excluir a conversa:", error);
        return res
            .status(500)
            .json({ error: "Erro ao excluir a conversa no banco de dados." });
    }
};
exports.limparConversa = limparConversa;
