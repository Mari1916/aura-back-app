"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const genai_1 = require("@google/genai");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
const SYSTEM_MESSAGE = "Você é um assistente de IA especialista em detecção e solução de pragas, focado em agricultura e jardinagem. Sua tarefa é analisar a descrição da praga fornecida pelo usuário, identificar o tipo mais provável (nome da praga ou doença), e, **em seguida**, sugerir a solução mais eficaz. A resposta deve ser **direta**, **concisa** e seguir estritamente o formato: **Praga Detectada:** [Nome da Praga]. **Solução Sugerida:** [Medida de controle].";
router.post('/message', async (req, res) => {
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
        const ai = new genai_1.GoogleGenAI({});
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const assistantResponse = response.text;
        // 4. SALVA APENAS A MENSAGEM ATUAL NO BANCO
        await prisma.$transaction([
            // Salva a mensagem do usuário
            prisma.chatMessage.create({
                data: {
                    conversaId: conversa.id,
                    content: message,
                    role: "user",
                }
            }),
            // Salva a resposta do assistente
            prisma.chatMessage.create({
                data: {
                    conversaId: conversa.id,
                    content: assistantResponse || '',
                    role: "assistant",
                }
            })
        ]);
        // 5. Retorna a resposta
        return res.json({
            response: assistantResponse,
            conversaId: conversa.id
        });
    }
    catch (error) {
        console.error("Erro no chat service:", error);
        return res.status(500).json({ error: "Erro interno no servidor ao processar a mensagem." });
    }
});
exports.default = router;
