import dotenv from "dotenv";
import { createServer } from "./config/server";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = createServer();

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
