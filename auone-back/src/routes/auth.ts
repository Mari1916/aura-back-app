import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'audne-secret';

// Cadastro
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, profissao, empresa } = req.body;

    if (!nome || !email || !senha || !profissao || !empresa) {
      return res.status(400).json({ erro: 'Preencha nome, email, senha, profissão e empresa.' });
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash, profissao, empresa },
    });

    // Gerar token JWT após cadastro
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }

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
