import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ✅ Rota para receber dados dos sensores (ESP32 envia via POST)
router.post('/sensores', async (req, res) => {
  try {
    const { deviceId, umidadeSolo, luminosidade, temperaturaSolo, temperaturaAr } = req.body;

    const dispositivo = await prisma.dispositivo.findUnique({ where: { deviceId } });
    if (!dispositivo) {
      return res.status(404).json({ erro: 'Dispositivo não encontrado' });
    }

    const dado = await prisma.dadoSensor.create({
      data: {
        dispositivoId: dispositivo.id,
        umidadeSolo,
        luminosidade,
        temperaturaSolo,
        temperaturaAr,
      },
    });

    res.status(201).json(dado);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ erro: 'Erro ao salvar dados do sensor', detalhe: error.message });
    } else {
      res.status(500).json({ erro: 'Erro desconhecido ao salvar dados', detalhe: String(error) });
    }
  }
});

// ✅ Rota para consultar dados por data (app usa via GET)
router.get('/sensores/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { dataInicio, dataFim } = req.query;

    const dispositivo = await prisma.dispositivo.findUnique({ where: { deviceId } });
    if (!dispositivo) {
      return res.status(404).json({ erro: 'Dispositivo não encontrado' });
    }

    const inicio = new Date(dataInicio as string);
    const fim = new Date(dataFim as string);

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return res.status(400).json({ erro: 'Datas inválidas' });
    }

    const dados = await prisma.dadoSensor.findMany({
      where: {
        dispositivoId: dispositivo.id,
        criadoEm: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: { criadoEm: 'asc' },
    });

    res.json(dados);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ erro: 'Erro ao consultar dados', detalhe: error.message });
    } else {
      res.status(500).json({ erro: 'Erro desconhecido ao consultar dados', detalhe: String(error) });
    }
  }
});

export default router;
