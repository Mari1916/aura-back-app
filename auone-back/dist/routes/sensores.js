"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Armazena o último pacote recebido do ESP32
let ultimoDado = {
    deviceId: '',
    temperaturaAr: null,
    umidadeAr: null,
    umidadeSolo: null,
    luminosidade: null,
    timestamp: null
};
// ==================== SENSORES ====================
// Receber dados do ESP32 e salvar no banco
router.post('/', async (req, res) => {
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
        const dadoSalvo = await prisma.dadoSensor.create({
            data: {
                dispositivoId: dispositivo.id,
                umidadeSolo,
                luminosidade,
                umidadeAr,
                temperaturaAr
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
