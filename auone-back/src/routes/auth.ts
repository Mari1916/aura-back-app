import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Rota POST /cadastro
router.post("/cadastro", async (req: Request, res: Response) => {
  console.log("Recebido no back:", req.body);

  try {
    const { nome, email, senha, profissao, empresa } = req.body;

    if (!nome || !email || !senha || !profissao || !empresa) {
      return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(400).json({ erro: "E-mail já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash, profissao, empresa },
    });

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ usuario, token });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao cadastrar usuário",
      detalhe: error instanceof Error ? error.message : String(error)
    });
  }
});

// Rota POST /login
router.post("/login", async (req: Request, res: Response) => {
  console.log("Login recebido:", req.body);

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

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao fazer login",
      detalhe: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;