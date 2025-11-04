import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, DadoSensor } from "@prisma/client";
import dotenv from "dotenv";
import multer from 'multer';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

// Configura o multer para armazenar a imagem em memória
const storage = multer.memoryStorage();
const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("⚠️ JWT_SECRET não definido no .env");
  process.exit(1);
}

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
  deviceId: '',
  temperaturaAr: null,
  umidadeAr: null,
  umidadeSolo: null,
  luminosidade: null,
  timestamp: null
};

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
  } catch (error: unknown) {
    console.error("Erro no cadastro:", error);
    // Em desenvolvimento, retorne detalhe do erro para facilitar o debug.
    if (process.env.NODE_ENV !== 'production') {
      if (error instanceof Error) {
        return res.status(500).json({ erro: 'Erro ao cadastrar usuário', detalhe: error.message, stack: error.stack });
      }
      return res.status(500).json({ erro: 'Erro ao cadastrar usuário', detalhe: String(error) });
    }

    // Em produção, mantenha a resposta genérica para não vazar detalhes sensíveis.
    res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
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

// ==================== DISPOSITIVOS ====================
router.post('/dispositivos', async (req: Request, res: Response) => {
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

// ==================== PERFIL ====================
router.get('/perfil', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      userId = decoded.id;
    } catch {
      return res.status(401).json({ erro: 'Token inválido' });
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
    });

    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// ==================== ATUALIZAR PERFIL ====================
router.put('/atualizarPerfil', upload.single('foto'), async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      userId = decoded.id;
    } catch {
      return res.status(401).json({ erro: 'Token inválido' });
    }

    const {
      nome,
      email,
      profissao,
      empresa,
      areaTotal,
      cultivos,
      dispositivosAtivos,
    } = req.body;

    let fotoBase64: string | undefined;
    if (req.file) {
      fotoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: {
        nome,
        email,
        profissao,
        empresa,
        foto: fotoBase64,
        areaTotal: areaTotal !== undefined ? Number(areaTotal) : undefined,
        cultivos,
        dispositivosAtivos: dispositivosAtivos !== undefined ? Number(dispositivosAtivos) : undefined,
        ultimaAtualizacao: new Date(),
      },
    });

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar perfil', detalhe: String(error) });
  }
});

// ==================== SENSORES ====================
// Receber dados do ESP32 e salvar no banco
router.post('/sensores', async (req: Request, res: Response) => {
  try {
    const { deviceId, temperaturaAr, umidadeAr, umidadeSolo, luminosidade } = req.body;

    if (!deviceId) {
      return res.status(400).json({ erro: 'deviceId é obrigatório' });
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

    console.log('📦 Dados recebidos do ESP32:', ultimoDado);

    const dispositivo = await prisma.dispositivo.findUnique({ where: { deviceId } });
    if (!dispositivo) {
      return res.status(404).json({ erro: 'Dispositivo não encontrado no banco' });
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
    console.error('Erro ao salvar dados do sensor:', error);
    if (error instanceof Error) {
      res.status(500).json({ erro: 'Erro ao salvar dados', detalhe: error.message });
    } else {
      res.status(500).json({ erro: 'Erro desconhecido', detalhe: String(error) });
    }
  }
});

// Enviar o último dado ao front
router.get('/sensores', (req: Request, res: Response) => {
  res.json(ultimoDado);
});

export default router;