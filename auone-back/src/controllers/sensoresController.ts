import { Request, Response } from "express";
import { PrismaClient, DadoSensor } from "@prisma/client";

const prisma = new PrismaClient();

// Tipo do último dado em memória
interface UltimoDado {
  deviceId: string;
  temperaturaAr: number | null;
  umidadeAr: number | null;
  umidadeSolo: number | null;
  luminosidade: number | null;
  timestamp: string | null;
}

// Armazena o último pacote recebido do ESP32
let ultimoDado: UltimoDado = {
  deviceId: "",
  temperaturaAr: null,
  umidadeAr: null,
  umidadeSolo: null,
  luminosidade: null,
  timestamp: null
};

// ==================== RECEBER DADOS ====================
export const receberDadosSensor = async (req: Request, res: Response) => {
  try {
    const { deviceId, temperaturaAr, umidadeAr, umidadeSolo, luminosidade } = req.body;

    if (!deviceId) {
      return res.status(400).json({ erro: "deviceId é obrigatório" });
    }

    // Atualiza o último dado em memória
    ultimoDado = {
      deviceId,
      temperaturaAr,
      umidadeAr,
      umidadeSolo,
      luminosidade,
      timestamp: new Date().toISOString()
    };

    console.log("📦 Dados recebidos do ESP32:", ultimoDado);

    const dispositivo = await prisma.dispositivo.findUnique({ where: { deviceId } });
    if (!dispositivo) {
      return res.status(404).json({ erro: "Dispositivo não encontrado no banco" });
    }

    const dadoSalvo: DadoSensor = await prisma.dadoSensor.create({
      data: {
        dispositivoId: dispositivo.id,
        umidadeSolo,
        luminosidade,
        umidadeAr,
        temperaturaAr
      }
    });

    res.status(201).json(dadoSalvo);
  } catch (error: unknown) {
    console.error("Erro ao salvar dados do sensor:", error);
    if (error instanceof Error) {
      res.status(500).json({ erro: "Erro ao salvar dados", detalhe: error.message });
    } else {
      res.status(500).json({ erro: "Erro desconhecido", detalhe: String(error) });
    }
  }
};

// ==================== ENVIAR ÚLTIMO DADO ====================
export const enviarUltimoDado = (req: Request, res: Response) => {
  res.json(ultimoDado);
};
