import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

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
    // Garante que o ID seja string
    const usuario = await prisma.usuario.findUnique({
      where: { id: String(userId) },
    });

    if (!usuario) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    const conversa = await prisma.conversa.create({
      data: {
        usuarioId: String(userId),
        titulo: "Consulta: " + message.substring(0, 30) + "...",
      },
    });

    // Instancia o Gemini 2.5
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não encontrada no .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);


    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash", // modelo válido
    });

    const result = await model.generateContent(
      `${SYSTEM_MESSAGE}\n\nUsuário descreve: ${message}`
    );

    const assistantResponse = result.response.text();

    // Salva no banco
    await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversaId: conversa.id,
          content: message,
          role: "user",
          usuarioId: String(userId),
        },
      }),
      prisma.chatMessage.create({
        data: {
          conversaId: conversa.id,
          content: assistantResponse || "",
          role: "assistant",
          usuarioId: String(userId),
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
