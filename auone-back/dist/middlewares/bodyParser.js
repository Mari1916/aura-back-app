"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyParser = void 0;
const express_1 = __importDefault(require("express"));
exports.bodyParser = [
    express_1.default.json({ limit: "20mb" }),
    express_1.default.urlencoded({ extended: true })
];
