import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

// DELETE /chat/clear/:conversaId
// 💡 Esta rota de limpeza pode ser MANTIDA se você quiser excluir conversas antigas

router.delete('/clear/:conversaId', async (req: Request, res: Response) => {
  const { conversaId } = req.params;

  try {
    // Deleta a conversa e todas as mensagens
    await prisma.conversa.delete({
      where: { id: conversaId }
    });

    return res.json({
      message: "Conversa e histórico excluídos com sucesso.",
      conversaId
    });
  } catch (error) {
    console.error("Erro ao excluir a conversa:", error);
    return res
      .status(500)
      .json({ error: "Erro ao excluir a conversa no banco de dados." });
  }
});

export default router;
