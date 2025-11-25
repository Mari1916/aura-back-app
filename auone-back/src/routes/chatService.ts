import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/prisma";

const router = express.Router();

dotenv.config();

const SYSTEM_MESSAGE = "Você é um assistente de IA especialista em detecção e solução de pragas, focado em agricultura e jardinagem. Sua tarefa é analisar a descrição da praga fornecida pelo usuário, identificar o tipo mais provável (nome da praga ou doença), e, **em seguida**, sugerir a solução mais eficaz. A resposta deve ser **direta**, **concisa** e seguir estritamente o formato: **Praga Detectada:** [Nome da Praga]. **Solução Sugerida:** [Medida de controle].";

router.post('/message', async (req: Request, res: Response) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "userId e message são obrigatórios." });
  }

  try {
    // 1. Cria uma nova conversa para cada mensagem (ou usa lógica diferente se preferir)
    const conversa = await prisma.conversa.create({
      data: { 
        usuarioId: userId, 
        titulo: "Consulta: " + message.substring(0, 30) + "..."
      }
    });

    // 2. Prepara o prompt para o Gemini
    const prompt = `${SYSTEM_MESSAGE}\n\nUsuário descreve: ${message}`;

    // 3. CHAMA A API DO GOOGLE GEMINI
    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const assistantResponse = response.text;

    // 4. SALVA APENAS A MENSAGEM ATUAL NO BANCO
    await prisma.$transaction([
  prisma.chatMessage.create({
    data: {
      conversaId: conversa.id,
      content: message,
      role: "user",
      usuarioId: userId
    }
  }),

  prisma.chatMessage.create({
    data: {
      conversaId: conversa.id,
      content: assistantResponse || "",
      role: "assistant",
      usuarioId: userId   // OU "assistant"
    }
  })
]);


    // 5. Retorna a resposta
    return res.json({
      response: assistantResponse,
      conversaId: conversa.id
    });

  } catch (error) {
    console.error("Erro no chat service:", error);
    return res.status(500).json({ error: "Erro interno no servidor ao processar a mensagem." });
  }
});

export default router;