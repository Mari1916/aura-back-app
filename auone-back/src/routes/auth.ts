import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Rota POST /api/auth/cadastro
router.post("/cadastro", async (req: Request, res: Response) => {
  console.log("Recebido no back:", req.body); // debug

  try {
    const { nome, email, senha, profissao, empresa } = req.body;

    if (!nome || !email || !senha || !profissao || !empresa) {
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos: nome, email, senha, profissão e empresa." });
    }

    // Verifica se usuário já existe
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(400).json({ erro: "E-mail já cadastrado" });
    }

    // Criptografa senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria usuário no banco
    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash, profissao, empresa },
    });

    // Gera token JWT
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ usuario, token });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return res.status(500).json({ erro: "Erro ao cadastrar usuário", detalhe: error.message });
    }
    return res.status(500).json({ erro: "Erro desconhecido", detalhe: String(error) });
  }
});

// Rota POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  console.log("Login recebido:", req.body); // debug
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Preencha email e senha" });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ erro: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ usuario, token });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return res.status(500).json({ erro: "Erro ao fazer login", detalhe: error.message });
    }
    return res.status(500).json({ erro: "Erro desconhecido", detalhe: String(error) });
  }
});

export default router;
