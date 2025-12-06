import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

dotenv.config();

const SYSTEM_MESSAGE = "Você é um assistente de IA especialista em detecção e solução de pragas, focado em agricultura e jardinagem. Sua tarefa é analisar a descrição da praga fornecida pelo usuário, identificar o tipo mais provável (nome da praga ou doença), e, **em seguida**, sugerir a solução mais eficaz. A resposta deve ser **direta**, **concisa** e seguir estritamente o formato: **Praga Detectada:** [Nome da Praga]. **Solução Sugerida:** [Medida de controle].";

router.post("/message", async (req: Request, res: Response) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "userId e message são obrigatórios." });
  }

  try {
    // 1. Verifica se usuário existe
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    // 2. Cria conversa
    const conversa = await prisma.conversa.create({
      data: {
        usuarioId: userId,
        titulo: "Consulta: " + message.substring(0, 30) + "...",
      },
    });

    // 3. Prepara prompt
    const prompt = `${SYSTEM_MESSAGE}\n\nUsuário descreve: ${message}`;

    // 4. Chama Gemini (instanciação correta: só a string da chave)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    // use "gemini-pro" para garantir compatibilidade
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-001",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const assistantResponse = response.text();

    console.log("Resposta Gemini:", assistantResponse);

    // 5. Salva mensagens
    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { conversaId: conversa.id, content: message, role: "user", usuarioId: userId },
      }),
      prisma.chatMessage.create({
        data: { conversaId: conversa.id, content: assistantResponse || "", role: "assistant", usuarioId: userId },
      }),
    ]);

    // 6. Retorna resposta
    return res.json({ response: assistantResponse, conversaId: conversa.id });
  } catch (error) {
    console.error("🔥 Erro no chat service:", error);
    return res.status(500).json({ error: "Erro interno no servidor ao processar a mensagem." });
  }
});

export default router;
