import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

dotenv.config();

const SYSTEM_MESSAGE = "Você é um assistente de IA especialista em detecção e solução de pragas...";

router.post("/message", async (req: Request, res: Response) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "userId e message são obrigatórios." });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    const conversa = await prisma.conversa.create({
      data: {
        usuarioId: userId,
        titulo: "Consulta: " + message.substring(0, 30) + "...",
      },
    });

    const prompt = `${SYSTEM_MESSAGE}\n\nUsuário descreve: ${message}`;

    // Instanciação correta
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const assistantResponse = response.text();

    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { conversaId: conversa.id, content: message, role: "user", usuarioId: userId },
      }),
      prisma.chatMessage.create({
        data: { conversaId: conversa.id, content: assistantResponse || "", role: "assistant", usuarioId: userId },
      }),
    ]);

    return res.json({ response: assistantResponse, conversaId: conversa.id });
  } catch (error) {
    console.error("Erro no chat service:", error);
    return res.status(500).json({ error: "Erro interno no servidor ao processar a mensagem." });
  }
});

export default router;
