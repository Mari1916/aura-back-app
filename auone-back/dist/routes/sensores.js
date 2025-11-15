"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sensoresController_1 = require("../controllers/sensoresController");
const router = express_1.default.Router();
// POST /api/sensores
router.post("/", sensoresController_1.receberDadosSensor);
// GET /api/sensores
router.get("/sensores", sensoresController_1.enviarUltimoDado);
exports.default = router;
