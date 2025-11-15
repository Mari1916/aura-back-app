"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarUltimoDado = exports.receberDadosSensor = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Armazena o último pacote recebido do ESP32
let ultimoDado = {
    deviceId: "",
    temperaturaAr: null,
    umidadeAr: null,
    umidadeSolo: null,
    luminosidade: null,
    timestamp: null
};
// ==================== RECEBER DADOS ====================
const receberDadosSensor = async (req, res) => {
    try {
        const { deviceId, temperaturaAr, umidadeAr, umidadeSolo, luminosidade } = req.body;
        if (!deviceId) {
            return res.status(400).json({ erro: "deviceId é obrigatório" });
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
        console.log("📦 Dados recebidos do ESP32:", ultimoDado);
        const dispositivo = await prisma.dispositivo.findUnique({ where: { deviceId } });
        if (!dispositivo) {
            return res.status(404).json({ erro: "Dispositivo não encontrado no banco" });
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
        console.error("Erro ao salvar dados do sensor:", error);
        if (error instanceof Error) {
            res.status(500).json({ erro: "Erro ao salvar dados", detalhe: error.message });
        }
        else {
            res.status(500).json({ erro: "Erro desconhecido", detalhe: String(error) });
        }
    }
};
exports.receberDadosSensor = receberDadosSensor;
// ==================== ENVIAR ÚLTIMO DADO ====================
const enviarUltimoDado = (req, res) => {
    res.json(ultimoDado);
};
exports.enviarUltimoDado = enviarUltimoDado;
