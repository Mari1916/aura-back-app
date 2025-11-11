// src/routes/chat.ts

import { Request, Response, Router } from "express";
import OpenAI from 'openai';
import 'dotenv/config'; 


const openai = new OpenAI(); 
const chatRouter = Router();


// Em produção, isso deve ir para um DB ou cache (ex: Redis).
const conversations: { [key: string]: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> } = {};

// Mensagem de Sistema Aprimorada para garantir o foco em Detecção e Solução
const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
    role: "system",
    content: "Você é um assistente de IA especialista em detecção e solução de pragas, focado em agricultura e jardinagem. Sua tarefa é analisar a descrição da praga fornecida pelo usuário, identificar o tipo mais provável (nome da praga ou doença), e, **em seguida**, sugerir a solução mais eficaz. A resposta deve ser **direta**, **concisa** e seguir estritamente o formato: **Praga Detectada:** [Nome da Praga]. **Solução Sugerida:** [Medida de controle]."
};

chatRouter.post('/message', async (req: Request, res: Response) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: "userId e message são obrigatórios." });
    }

    try {
        // 1. Carrega ou Inicializa o histórico com a System Message
        if (!conversations[userId]) {
            // A System Message é sempre a primeira
            conversations[userId] = [systemMessage]; 
        }
        
        // 2. Adiciona a nova mensagem do usuário ao histórico
        const userMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = { role: "user", content: message };
        conversations[userId].push(userMessage);

        // 3. Chama a API da OpenAI com o histórico COMPLETO
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Bom para custo-benefício e tarefas de chat
            messages: conversations[userId], // Passa o histórico completo
        });

        // 4. Extrai a resposta e verifica se é válida
        const assistantResponse = completion.choices[0].message;

        if (!assistantResponse.content) {
             // Tratamento para resposta vazia, remove a mensagem do usuário do histórico e lança erro
            conversations[userId]?.pop();
            return res.status(500).json({ error: "A IA não conseguiu gerar uma resposta válida." });
        }
        
        // 5. Salva a resposta do assistente no histórico
        conversations[userId].push(assistantResponse);

        // 6. Retorna a resposta
        return res.json({ 
            response: assistantResponse.content,
            userId: userId 
        });

    } catch (error) {
        console.error("Erro na comunicação com a OpenAI:", error);
        
        // Remove a última mensagem do usuário do histórico se a API falhar
        conversations[userId]?.pop(); 
        
        return res.status(500).json({ error: "Erro interno: Não foi possível processar a mensagem com a IA." });
    }
});

// --- Rota para Limpar o Histórico ---

chatRouter.get('/clear/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;

    if (conversations[userId]) {
        delete conversations[userId];
        return res.json({ message: "Histórico de conversa limpo com sucesso.", userId });
    }
    
    return res.status(404).json({ error: "Conversa não encontrada para este usuário." });
});

export default chatRouter;