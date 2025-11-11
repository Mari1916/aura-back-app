import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cadastrarDispositivo = async (req: Request, res: Response) => {
  try {
    const { nome, deviceId, usuarioId } = req.body;

    console.log("📦 Dados recebidos:", req.body);

    if (!nome || !deviceId || !usuarioId) {
      return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
    }

    const dispositivo = await prisma.dispositivo.create({
      data: {
        nome,
        deviceId,
        usuario: {
          connect: { id: usuarioId } // conecta ao usuário existente
        }
      }
    });

    res.status(201).json(dispositivo);
  } catch (error: unknown) {
    console.error("Erro ao cadastrar dispositivo:", error);

    if (error instanceof Error) {
      res.status(500).json({
        erro: "Erro ao cadastrar dispositivo",
        detalhe: error.message
      });
    } else {
      res.status(500).json({
        erro: "Erro desconhecido",
        detalhe: String(error)
      });
    }
  }
};
