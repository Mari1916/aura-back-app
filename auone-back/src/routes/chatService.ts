import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

dotenv.config();



router.post('/message', async (req: Request, res: Response) => {
      const {  message } = req.body;

const ai = new GoogleGenAI({});


  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Você é um especialista em jardinagem e plantas. Responda de forma clara e objetiva às perguntas relacionadas a cuidados com plantas, pragas, doenças e dicas de cultivo. Mantenha um tom amigável e acessível." + message,
  });


res.json({ reply: response.text });
});

export default router;