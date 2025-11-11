import { Router } from "express";
import { cadastrarDispositivo } from "../controllers/dispositivosController";

const router = Router();

// POST /api/dispositivo
router.post("/", cadastrarDispositivo);

export default router;
