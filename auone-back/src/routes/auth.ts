import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("⚠️ JWT_SECRET não definido no .env");
  process.exit(1);
}

// ==================== CADASTRO ====================
router.post("/cadastro", async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, profissao, empresa } = req.body;

    if (!nome || !email || !senha || !profissao || !empresa) {
      return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ erro: "E-mail já cadastrado" });

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash, profissao, empresa },
    });

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ usuario, token });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// ==================== LOGIN ====================
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Preencha email e senha" });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(401).json({ erro: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) return res.status(401).json({ erro: "Senha incorreta" });

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ usuario, token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ erro: "Erro ao fazer login" });
  }
});

// TESTE ROTA DE PERFIL

router.get('/perfil', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' })

    let userId: string
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
      userId = decoded.id
    } catch (err) {
      return res.status(401).json({ erro: 'Token inválido' })
    }
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        profissao: true,
        empresa: true,
        foto: true,
        areaTotal: true,
        cultivos: true,
        dispositivosAtivos: true,
        ultimaAtualizacao: true,
      }
    })

    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' })

    res.json(usuario)
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    res.status(500).json({ erro: 'Erro interno do servidor' })
  }
})


// Adiciona rota de atualização de perfil do usuário autenticado
router.put('/atualizarPerfil', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' })

    let userId: string
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
      userId = decoded.id
    } catch (err) {
      return res.status(401).json({ erro: 'Token inválido' })
    }

    const { nome, email, profissao, empresa, foto, areaTotal, cultivos, dispositivosAtivos } = req.body
    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: {
        nome,
        email,
        profissao,
        empresa,
        foto,
        areaTotal: areaTotal !== undefined ? Number(areaTotal) : undefined,
        cultivos,
        dispositivosAtivos: dispositivosAtivos !== undefined ? Number(dispositivosAtivos) : undefined,
        ultimaAtualizacao: new Date(),
      },
    })

    res.json(usuario)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar perfil', detalhe: String(error) })
  }
})


// Rota para receber dados dos sensores (ESP32 envia via POST)
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

// Rota para consultar dados por data (app usa via GET)
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
