"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dispositivosController_1 = require("../controllers/dispositivosController");
const router = (0, express_1.Router)();
// POST /api/dispositivo
router.post("/", dispositivosController_1.cadastrarDispositivo);
exports.default = router;
