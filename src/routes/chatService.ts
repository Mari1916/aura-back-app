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
  console.log("📩 Body recebido:", req.body);

  if (!userId || !message) {
    return res.status(400).json({ error: "userId e message são obrigatórios." });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    console.log("👤 Usuário encontrado:", usuario);

    if (!usuario) {
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    const conversa = await prisma.conversa.create({
      data: { usuarioId: userId, titulo: "Consulta: " + message.substring(0, 30) + "..." },
    });

    const prompt = `${SYSTEM_MESSAGE}\n\nUsuário descreve: ${message}`;
    console.log("📝 Prompt:", prompt);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    console.log("🤖 Resultado Gemini:", result);

    const response = await result.response;
    const assistantResponse = response.text();
    console.log("💬 Resposta Gemini:", assistantResponse);

    await prisma.$transaction([
      prisma.chatMessage.create({ data: { conversaId: conversa.id, content: message, role: "user", usuarioId: userId } }),
      prisma.chatMessage.create({ data: { conversaId: conversa.id, content: assistantResponse || "", role: "assistant", usuarioId: userId } }),
    ]);

    return res.json({ response: assistantResponse, conversaId: conversa.id });
  } catch (error) {
    console.error("🔥 Erro no chat service:", error);
    return res.status(500).json({ error: "Erro interno no servidor ao processar a mensagem." });
  }
});


export default router;
