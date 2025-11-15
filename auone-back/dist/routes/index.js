"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_1 = __importDefault(require("./auth"));
const dispositivos_1 = __importDefault(require("./dispositivos"));
const sensores_1 = __importDefault(require("./sensores"));
const chatService_1 = __importDefault(require("./chatService"));
const setupRoutes = (app) => {
    app.use("/api/auth", auth_1.default);
    app.use("/api/dispositivo", dispositivos_1.default);
    app.use("/api/sensores", sensores_1.default);
    app.use("/api/chat", chatService_1.default);
    app.get("/", (req, res) => {
        res.json({ message: "🌿 API AUONE rodando com sucesso!" });
    });
};
exports.setupRoutes = setupRoutes;
