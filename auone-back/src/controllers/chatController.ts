import { Request, Response } from "express";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const openai = new OpenAI();
const prisma = new PrismaClient();

const SYSTEM_MESSAGE_CONTENT =
  "Você é um assistente de IA prestativo, especialista e amigável. Suas respostas devem ser concisas e em português.";

// POST /chat/message
export const enviarMensagemChat = async (req: Request, res: Response) => {
  const { userId, message, conversaId: inputConversaId } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "userId e message são obrigatórios." });
  }

  let currentConversaId = inputConversaId;

  try {
    // 1. Gerenciamento da conversa
    if (!currentConversaId) {
      let conversa = await prisma.conversa.findFirst({
        where: { usuarioId: userId },
        orderBy: { criadoEm: "desc" }
      });

      if (!conversa) {
        conversa = await prisma.conversa.create({
          data: {
            usuarioId: userId,
            titulo: "Nova Conversa de " + userId.substring(0, 5)
          }
        });
      }
      currentConversaId = conversa.id;
    }

    // 2. Carrega histórico
    const history = await prisma.chatMessage.findMany({
      where: { conversaId: currentConversaId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true }
    });

    let messagesForOpenAI: ChatCompletionMessageParam[] = history.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })
    );

    if (messagesForOpenAI.length === 0 || messagesForOpenAI[0].role !== "system") {
      messagesForOpenAI.unshift({ role: "system", content: SYSTEM_MESSAGE_CONTENT });
    }

    const userMessage = { role: "user", content: message };
    messagesForOpenAI.push(userMessage as ChatCompletionMessageParam);

    // 3. Chama OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messagesForOpenAI
    });

    const assistantResponse = completion.choices[0].message;

    // 4. Salva no banco
    await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversaId: currentConversaId,
          content: userMessage.content,
          role: userMessage.role
        }
      }),
      prisma.chatMessage.create({
        data: {
          conversaId: currentConversaId,
          content: assistantResponse.content || "",
          role: assistantResponse.role
        }
      })
    ]);

    return res.json({
      response: assistantResponse.content,
      conversaId: currentConversaId
    });
  } catch (error) {
    console.error("Erro na comunicação ou no banco de dados:", error);
    return res
      .status(500)
      .json({ error: "Erro interno no servidor ao processar a requisição de chat." });
  }
};

// DELETE /chat/clear/:conversaId
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
