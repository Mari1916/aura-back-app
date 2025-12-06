import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// @ts-ignore → ignora o bug do TypeScript no pacote
const { Client } = require("@google/genai");

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

const SYSTEM_MESSAGE =
  "Você é um assistente de IA especialista em detecção e solução de pragas.";

router.post("/message", async (req: Request, res: Response) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "userId e message são obrigatórios." });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    const conversa = await prisma.conversa.create({
      data: {
        usuarioId: userId,
        titulo: "Consulta: " + message.substring(0, 30) + "...",
      },
    });

    // Instancia o cliente
    const client = new Client({ apiKey: process.env.GEMINI_API_KEY });

    const result = await client.models.generateText({
      model: "gemini-1.5-flash",
      prompt: `${SYSTEM_MESSAGE}\n\nUsuário descreve: ${message}`,
    });

    const assistantResponse = result.outputText;

    await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversaId: conversa.id,
          content: message,
          role: "user",
          usuarioId: userId,
        },
      }),
      prisma.chatMessage.create({
        data: {
          conversaId: conversa.id,
          content: assistantResponse || "",
          role: "assistant",
          usuarioId: userId,
        },
      }),
    ]);

    return res.json({
      response: assistantResponse,
      conversaId: conversa.id,
    });

  } catch (error) {
    console.error("🔥 Erro no chat service:", error);
    return res.status(500).json({
      error: "Erro interno no servidor ao processar a mensagem.",
    });
  }
});

export default router;
