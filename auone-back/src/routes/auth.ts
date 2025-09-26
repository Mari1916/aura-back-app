import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret"; // fallback

router.post("/cadastro", async (req: Request, res: Response) => {
  console.log("Dados recebidos:", req.body); // <- ajuda a identificar problemas de JSON
  try {
    const { nome, email, senha, profissao, empresa } = req.body;

    if (!nome || !email || !senha || !profissao || !empresa) {
      return res
        .status(400)
        .json({ erro: "Preencha nome, email, senha, profissão e empresa." });
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

    return res
      .status(201)
      .json({ mensagem: "Usuário criado com sucesso", usuario, token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res
        .status(500)
        .json({ erro: "Erro ao cadastrar usuário", detalhe: error.message });
    }
    return res
      .status(500)
      .json({ erro: "Erro desconhecido", detalhe: String(error) });
  }
});


// Rota POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ erro: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({ token, usuario });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res
        .status(500)
        .json({ erro: "Erro ao fazer login", detalhe: error.message });
    }
    return res
      .status(500)
      .json({ erro: "Erro desconhecido", detalhe: String(error) });
  }
});

export default router;
