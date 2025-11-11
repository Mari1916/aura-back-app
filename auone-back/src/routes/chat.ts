// src/routes/chat.ts

import { Request, Response, Router } from "express";
import OpenAI from 'openai';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const openai = new OpenAI();
const chatRouter = Router();
// Certifique-se de que o PrismaClient está sendo inicializado corretamente,
// preferencialmente de forma centralizada. Aqui, criamos uma nova instância:
const prisma = new PrismaClient();

const SYSTEM_MESSAGE_CONTENT = "Você é um assistente de IA prestativo, especialista e amigável. Suas respostas devem ser concisas e em português.";

// ----------------------------------------------------
// POST /chat/message: Envia mensagem e persiste o histórico
// Espera: { userId: string, message: string, conversaId?: string }
// ----------------------------------------------------
chatRouter.post('/message', async (req: Request, res: Response) => {
    const { userId, message, conversaId: inputConversaId } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: "userId e message são obrigatórios." });
    }

    let currentConversaId = inputConversaId;

    try {
        // 1. GERENCIAMENTO DA CONVERSA: Encontra ou cria a conversa
        if (!currentConversaId) {
            // Se o cliente não enviou um conversaId, tenta encontrar a mais recente
            let conversa = await prisma.conversa.findFirst({
                where: { usuarioId: userId },
                orderBy: { criadoEm: 'desc' }
            });

            if (!conversa) {
                // Se não houver conversas, cria uma nova
                conversa = await prisma.conversa.create({
                    data: { usuarioId: userId, titulo: "Nova Conversa de " + userId.substring(0, 5) }
                });
            }
            currentConversaId = conversa.id;
        }

        // 2. CARREGA O HISTÓRICO: Busca as mensagens pelo ID da conversa
        const history = await prisma.chatMessage.findMany({
            where: { conversaId: currentConversaId },
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true }
        });

        // 3. FORMATA E ADICIONA MENSAGENS PARA A OPENAI
        let messagesForOpenAI: ChatCompletionMessageParam[] = history.map((msg: { role: string; content: string }) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));

        // Adiciona a mensagem do sistema no início, se o histórico estiver vazio
        if (messagesForOpenAI.length === 0 || messagesForOpenAI[0].role !== 'system') {
            messagesForOpenAI.unshift({ role: "system", content: SYSTEM_MESSAGE_CONTENT });
        }

        // Adiciona a nova mensagem do usuário
        const userMessage = { role: "user", content: message };
        messagesForOpenAI.push(userMessage as ChatCompletionMessageParam);


        // 4. CHAMA A API da OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messagesForOpenAI,
        });

        const assistantResponse = completion.choices[0].message;

        // 5. SALVA NO BANCO (Transação para garantir que ambas sejam salvas)
        await prisma.$transaction([
            // Salva a mensagem do usuário
            prisma.chatMessage.create({
                data: {
                    conversaId: currentConversaId,
                    content: userMessage.content,
                    role: userMessage.role,
                }
            }),
            // Salva a resposta do assistente
            prisma.chatMessage.create({
                data: {
                    conversaId: currentConversaId,
                    content: assistantResponse.content || '',
                    role: assistantResponse.role,
                }
            })
        ]);

        // 6. Retorna a resposta ao frontend
        return res.json({
            response: assistantResponse.content,
            conversaId: currentConversaId // Retorna o ID da conversa para que o frontend possa usá-lo
        });

    } catch (error) {
        console.error("Erro na comunicação ou no banco de dados:", error);
        return res.status(500).json({ error: "Erro interno no servidor ao processar a requisição de chat." });
    }
});

// A rota de limpeza de histórico agora deleta a Conversa e todas as ChatMessages relacionadas
chatRouter.delete('/clear/:conversaId', async (req: Request, res: Response) => {
    const { conversaId } = req.params;

    try {
        await prisma.conversa.delete({
            where: { id: conversaId }
        });

        // As ChatMessages serão excluídas automaticamente se você configurou
        // onDelete: Cascade no seu schema, mas a exclusão da conversa já é suficiente.

        return res.json({ message: "Conversa e histórico excluídos com sucesso.", conversaId });

    } catch (error) {
        console.error("Erro ao excluir a conversa:", error);
        return res.status(500).json({ error: "Erro ao excluir a conversa no banco de dados." });
    }
});

export default chatRouter;