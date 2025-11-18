import express from "express";
import { receberDadosSensor, enviarUltimoDado } from "../controllers/sensoresController";

const router = express.Router();

// POST /api/sensores
router.post("/", receberDadosSensor);

// GET /api/sensores/sensores
router.get("/sensores", enviarUltimoDado);

export default router;
