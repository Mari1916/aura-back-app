"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const corsConfig_1 = require("../middlewares/corsConfig");
const bodyParser_1 = require("../middlewares/bodyParser");
const notFound_1 = require("../middlewares/notFound");
const routes_1 = require("../routes");
const createServer = () => {
    const app = (0, express_1.default)();
    app.use(corsConfig_1.corsConfig);
    app.use(bodyParser_1.bodyParser);
    (0, routes_1.setupRoutes)(app);
    app.use(notFound_1.notFound);
    return app;
};
exports.createServer = createServer;
