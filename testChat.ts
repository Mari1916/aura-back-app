import axios from "axios";

async function test() {
  const res = await axios.post(
    "https://aura-back-app.onrender.com/api/chat/message", // URL do Render
    {
      userId: "1", // agora como string
      message: "Minha planta está com folhas amareladas, o que pode ser?"
    }
  );
  console.log(res.data);
}

test();
