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
// Enable Prisma detailed logging to help diagnose runtime DB errors (queries, warnings, errors)
const prisma = new client_1.PrismaClient({ log: ["query", "info", "warn", "error"] });
// Configura o multer para armazenar a imagem em memória
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("⚠️ JWT_SECRET não definido no .env");
    process.exit(1);
}
// Armazena o último pacote recebido do ESP32
let ultimoDado = {
    deviceId: '',
    temperaturaAr: null,
    umidadeAr: null,
    umidadeSolo: null,
    luminosidade: null,
    timestamp: null
};
// ==================== CADASTRO ====================
router.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha, profissao, empresa } = req.body;
        if (!nome || !email || !senha || !profissao || !empresa) {
            return res.status(400).json({ erro: "Preencha todos os campos" });
        }
        const existe = await prisma.usuario.findUnique({ where: { email } });
        if (existe)
            return res.status(400).json({ erro: "E-mail já cadastrado" });
        const senhaHash = await bcryptjs_1.default.hash(senha, 10);
        const usuario = await prisma.usuario.create({
            data: { nome, email, senhaHash, profissao, empresa },
        });
        const token = jsonwebtoken_1.default.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ usuario, token });
    }
    catch (error) {
        // Log full stack when available to help debugging in production logs
        if (error instanceof Error) {
            console.error("Erro no cadastro:", error.stack || error.message);
        }
        else {
            console.error("Erro no cadastro:", error);
        }
        res.status(500).json({ erro: "Erro ao cadastrar usuário" });
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
// ==================== DISPOSITIVOS ====================
router.post('/dispositivos', async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                erro: 'Erro ao cadastrar dispositivo',
                detalhe: error.message,
            });
        }
        else {
            res.status(500).json({
                erro: 'Erro desconhecido',
                detalhe: String(error),
            });
        }
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
// ==================== SENSORES ====================
// Receber dados do ESP32 e salvar no banco
router.post('/sensores', async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId) {
            return res.status(400).json({ erro: 'deviceId é obrigatório' });
        }
        // Função auxiliar para converter em número e tratar NaN
        const parseNumber = (v) => {
            if (v === undefined || v === null || v === '')
                return null;
            const n = Number(v);
            return Number.isNaN(n) ? null : n;
        };
        // Converte os valores recebidos para number | null
        const temperaturaAr = parseNumber(req.body.temperaturaAr);
        const umidadeAr = parseNumber(req.body.umidadeAr);
        const umidadeSolo = parseNumber(req.body.umidadeSolo);
        const luminosidade = parseNumber(req.body.luminosidade);
        // Verifica campos numéricos obrigatórios (conforme schema.prisma eles são required)
        const missingFields = [];
        if (temperaturaAr === null)
            missingFields.push('temperaturaAr');
        if (umidadeAr === null)
            missingFields.push('umidadeAr');
        if (umidadeSolo === null)
            missingFields.push('umidadeSolo');
        if (luminosidade === null)
            missingFields.push('luminosidade');
        if (missingFields.length > 0) {
            return res.status(400).json({ erro: 'Campos numéricos obrigatórios ausentes ou inválidos', campos: missingFields });
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
        const dadoSalvo = await prisma.dadoSensor.create({
            data: {
                dispositivoId: dispositivo.id,
                umidadeSolo: umidadeSolo,
                luminosidade: luminosidade,
                umidadeAr: umidadeAr,
                temperaturaAr: temperaturaAr
            }
        });
        res.status(201).json(dadoSalvo);
    }
    catch (error) {
        console.error('Erro ao salvar dados do sensor:', error);
        if (error instanceof Error) {
            res.status(500).json({ erro: 'Erro ao salvar dados', detalhe: error.message });
        }
        else {
            res.status(500).json({ erro: 'Erro desconhecido', detalhe: String(error) });
        }
    }
});
// Enviar o último dado ao front
router.get('/sensores', (req, res) => {
    res.json(ultimoDado);
});
exports.default = router;
