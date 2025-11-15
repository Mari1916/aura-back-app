"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const multerConfig_1 = require("../secure/multerConfig");
const router = express_1.default.Router();
router.post("/cadastro", authController_1.cadastroUsuario);
router.post("/login", authController_1.loginUsuario);
router.get("/perfil", authController_1.perfilUsuario);
router.put("/atualizarPerfil", multerConfig_1.upload.single("foto"), authController_1.atualizarPerfil);
exports.default = router;
