import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/ultimos20", async (_req: Request, res: Response) => {
  try {
    // Pega os últimos 20 registros da tabela 'dados' (troque pelo nome real da sua tabela)
    const dados = await prisma.dadoSensor.findMany({
      orderBy: { id: "desc" }, // ordena do mais recente
      take: 20,                // pega apenas 20
    });

    res.json(dados.reverse()); // opcional: do mais antigo pro mais recente
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

export default router;
