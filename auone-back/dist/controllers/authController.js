"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarPerfil = exports.perfilUsuario = exports.loginUsuario = exports.cadastroUsuario = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
// ==================== CADASTRO ====================
const cadastroUsuario = async (req, res) => {
    try {
        const { nome, email, senha, profissao, empresa } = req.body;
        if (!nome || !email || !senha || !profissao || !empresa) {
            return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ erro: "E-mail inválido." });
        }
        if (senha.length < 6) {
            return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });
        }
        const existe = await prisma.usuario.findUnique({ where: { email } });
        if (existe) {
            return res.status(400).json({ erro: "E-mail já cadastrado." });
        }
        const senhaHash = await bcryptjs_1.default.hash(senha, 10);
        const usuario = await prisma.usuario.create({
            data: { nome, email, senhaHash, profissao, empresa }
        });
        const token = jsonwebtoken_1.default.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ usuario, token });
    }
    catch (error) {
        res.status(500).json({ erro: "Erro ao cadastrar usuário", detalhe: String(error) });
    }
};
exports.cadastroUsuario = cadastroUsuario;
// ==================== LOGIN ====================
const loginUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ erro: "Preencha email e senha" });
        }
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario)
            return res.status(401).json({ erro: "Usuário não encontrado" });
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senhaHash);
        if (!senhaValida)
            return res.status(401).json({ erro: "Senha incorreta" });
        const token = jsonwebtoken_1.default.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ usuario, token });
    }
    catch (error) {
        res.status(500).json({ erro: "Erro ao fazer login", detalhe: String(error) });
    }
};
exports.loginUsuario = loginUsuario;
// ==================== PERFIL ====================
const perfilUsuario = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token)
            return res.status(401).json({ erro: "Token não fornecido" });
        let userId;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        catch {
            return res.status(401).json({ erro: "Token inválido" });
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
                dispositivos: {
                    select: {
                        id: true,
                        nome: true,
                        deviceId: true,
                        criadoEm: true,
                    },
                },
            },
        });
        if (!usuario)
            return res.status(404).json({ erro: "Usuário não encontrado" });
        res.json(usuario);
    }
    catch (error) {
        res.status(500).json({ erro: "Erro interno do servidor", detalhe: String(error) });
    }
};
exports.perfilUsuario = perfilUsuario;
// ==================== ATUALIZAR PERFIL ====================
const atualizarPerfil = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token)
            return res.status(401).json({ erro: "Token não fornecido" });
        let userId;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        catch {
            return res.status(401).json({ erro: "Token inválido" });
        }
        const { nome, email, profissao, empresa, areaTotal, cultivos, dispositivosAtivos } = req.body;
        let fotoBase64;
        if (req.file) {
            fotoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        }
        const usuario = await prisma.usuario.update({
            where: { id: userId },
            data: {
                nome,
                email,
                profissao,
                empresa,
                foto: fotoBase64,
                areaTotal: areaTotal ? Number(areaTotal) : undefined,
                cultivos,
                dispositivosAtivos: dispositivosAtivos ? Number(dispositivosAtivos) : undefined,
                ultimaAtualizacao: new Date()
            }
        });
        res.json(usuario);
    }
    catch (error) {
        res.status(500).json({ erro: "Erro ao atualizar perfil", detalhe: String(error) });
    }
};
exports.atualizarPerfil = atualizarPerfil;
