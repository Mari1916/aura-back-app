import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const limparConversa = async (req: Request, res: Response) => {
  const { conversaId } = req.params;

  try {
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
};