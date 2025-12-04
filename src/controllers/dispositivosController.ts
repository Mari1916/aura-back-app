import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const cadastrarDispositivo = async (req: Request, res: Response) => {
  try {
    const { nome, deviceId, usuarioId } = req.body;

    console.log(" Dados recebidos:", req.body);

    // 🔹 Verifica se todos os campos obrigatórios estão presentes
    if (!nome || !deviceId || !usuarioId) {
      return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
    }

    // 🔹 Verifica se já existe um dispositivo com o mesmo deviceId
    const existente = await prisma.dispositivo.findUnique({
      where: { deviceId },
    });

    if (existente) {
      return res.status(409).json({
        erro: "Dispositivo já cadastrado",
        detalhe: "Já existe um dispositivo com este deviceId.",
      });
    }

    //  Cria o novo dispositivo se não existir duplicado
    const dispositivo = await prisma.dispositivo.create({
      data: {
        nome,
        deviceId,
        usuario: {
          connect: { id: usuarioId }, // conecta ao usuário existente
        },
      },
    });

    console.log("✅ Dispositivo cadastrado com sucesso:", dispositivo);
    return res.status(201).json(dispositivo);

  } catch (error: unknown) {
    console.error("❌ Erro ao cadastrar dispositivo:", error);

    if (error instanceof Error) {
      return res.status(500).json({
        erro: "Erro ao cadastrar dispositivo",
        detalhe: error.message,
      });
    }

    return res.status(500).json({
      erro: "Erro desconhecido",
      detalhe: String(error),
    });
  }
};
