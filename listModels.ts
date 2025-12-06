import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

async function listarModelos() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY não encontrada no .env");

  const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=50&key=${apiKey}`;

  try {
    const resp = await axios.get(url);
    const modelos = resp.data.models;

    console.log("Modelos disponíveis e métodos suportados:");
    modelos.forEach((m: any) => {
      console.log(`- ${m.name}: ${m.supportedGenerationMethods.join(", ")}`);
    });
  } catch (err) {
    console.error("Erro ao listar modelos:", err);
  }
}

listarModelos();
