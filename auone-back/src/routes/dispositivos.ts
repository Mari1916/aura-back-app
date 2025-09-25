import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/dispositivos
router.post('/', async (req, res) => {
  try {
    const { nome, deviceId, usuarioId } = req.body;

    if (!nome || !deviceId || !usuarioId) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
    }

    const dispositivo = await prisma.dispositivo.create({
      data: {
        nome,
        deviceId,
        usuario: {
          connect: { id: usuarioId },
        },
      },
    });

    res.status(201).json(dispositivo);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        erro: 'Erro ao cadastrar dispositivo',
        detalhe: error.message,
      });
    } else {
      res.status(500).json({
        erro: 'Erro desconhecido',
        detalhe: String(error),
      });
    }
  }
});

export default router;
