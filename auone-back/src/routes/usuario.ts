import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Verifica se o ID é uma string válida
    if (!id || typeof id !== "string") {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    console.log("🔎 Buscando usuário com ID:", id);

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        dispositivos: {
          include: {
            sensores: {
              orderBy: { criadoEm: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!usuario) {
      console.warn("⚠️ Usuário não encontrado:", id);
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.status(200).json(usuario);
  } catch (error: unknown) {
    console.error("❌ Erro ao buscar usuário:", error);
    if (error instanceof Error) {
      res.status(500).json({ erro: 'Erro ao buscar usuário', detalhe: error.message });
    } else {
      res.status(500).json({ erro: 'Erro desconhecido ao buscar usuário', detalhe: String(error) });
    }
  }
});

export default router;
