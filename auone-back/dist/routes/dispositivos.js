"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/dispositivos
router.post('/', async (req, res) => {
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
exports.default = router;
