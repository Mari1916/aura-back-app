import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

console.log(process.env.GOOGLE_API_KEY);

async function testGemini() {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY não encontrada no .env");
        }

        const genAI = new GoogleGenerativeAI(apiKey); // chave como string

        // Usando modelo válido
        const model = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash", // modelo válido
        });


        // Gerando texto diretamente
        const result = await model.generateContent("Diga APENAS: OK");

        // Acessando o texto gerado corretamente
        console.log("Resposta:", result.response.text());
    } catch (error) {
        console.error("ERRO:", error);
    }
}

testGemini();
