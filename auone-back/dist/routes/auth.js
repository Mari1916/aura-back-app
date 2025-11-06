"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
dotenv_1.default.config();
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
async function startServer() {
    try {
        await prisma.$connect();
        console.log('✅ Conectado ao banco com sucesso!');
        // inicia seu servidor Express aqui
    }
    catch (error) {
        console.error('❌ Erro ao conectar no banco:', error);
    }
}
startServer();
// Configura o multer para armazenar a imagem em memória
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("⚠️ JWT_SECRET não definido no .env");
    process.exit(1);
}
// ==================== CADASTRO ====================
router.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha, profissao, empresa } = req.body;
        // Log para debug
        console.log("📨 Dados recebidos:", { nome, email, senha, profissao, empresa });
        // Validação básica
        if (!nome || !email || !senha || !profissao || !empresa) {
            return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
        }
        // Validação de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ erro: "E-mail inválido." });
        }
        // Validação de senha
        if (senha.length < 6) {
            return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });
        }
        // Verifica se o e-mail já está cadastrado
        const existe = await prisma.usuario.findUnique({ where: { email } });
        if (existe) {
            return res.status(400).json({ erro: "E-mail já cadastrado." });
        }
        const senhaHash = await bcryptjs_1.default.hash(senha, 10);
        // Criação do usuário com proteção contra undefined
        const usuario = await prisma.usuario.create({
            data: {
                nome: nome || "",
                email,
                senhaHash,
                profissao: profissao || "",
                empresa: empresa || "",
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ usuario, token });
    }
    catch (error) {
        console.error("❌ Erro completo no cadastro:", error);
        if (error instanceof Error) {
            return res.status(500).json({
                erro: "Erro ao cadastrar usuário",
                detalhe: error.message,
            });
        }
        res.status(500).json({ erro: "Erro desconhecido ao cadastrar usuário" });
    }
});
// ==================== LOGIN ====================
router.post("/login", async (req, res) => {
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
        console.error("Erro no login:", error);
        res.status(500).json({ erro: "Erro ao fazer login" });
    }
});
// ==================== PERFIL ====================
router.get('/perfil', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ erro: 'Token não fornecido' });
        let userId;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        catch {
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
        if (!usuario)
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        res.json(usuario);
    }
    catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});
// ==================== ATUALIZAR PERFIL ====================
router.put('/atualizarPerfil', upload.single('foto'), async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token)
            return res.status(401).json({ erro: 'Token não fornecido' });
        let userId;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            userId = decoded.id;
        }
        catch {
            return res.status(401).json({ erro: 'Token inválido' });
        }
        const { nome, email, profissao, empresa, areaTotal, cultivos, dispositivosAtivos, } = req.body;
        let fotoBase64;
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
    }
    catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar perfil', detalhe: String(error) });
    }
});
exports.default = router;
