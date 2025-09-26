import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'audne-secret';

// Rota POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, profissao, empresa } = req.body;

    // Validação básica
    if (!nome || !email || !senha || !profissao || !empresa) {
      return res.status(400).json({ erro: 'Preencha nome, email, senha, profissão e empresa.' });
    }

    // Verifica se usuário já existe
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    // Criptografa senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria usuário no banco
    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash, profissao, empresa },
    });

    // Gera token JWT (payload com id do usuário)
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ mensagem: 'Usuário criado com sucesso', usuario, token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ erro: 'Erro ao cadastrar usuário', detalhe: error.message });
    } else {
      res.status(500).json({ erro: 'Erro desconhecido', detalhe: String(error) });
    }
  }
});

// Rota POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca usuário pelo email
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado' });
    }

    // Compara senhas
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }

    // Gera token JWT
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, usuario });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ erro: 'Erro ao fazer login', detalhe: error.message });
    } else {
      res.status(500).json({ erro: 'Erro desconhecido', detalhe: String(error) });
    }
  }
});

export default router;
