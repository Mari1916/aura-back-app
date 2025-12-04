import express from "express";
import { cadastroUsuario, loginUsuario, perfilUsuario, atualizarPerfil } from "../controllers/authController";
import { upload } from "../secure/multerConfig";

const router = express.Router();

router.post("/cadastro", cadastroUsuario);
router.post("/login", loginUsuario);
router.get("/perfil", perfilUsuario);
router.put("/atualizarPerfil", upload.single("foto"), atualizarPerfil);

export default router;
