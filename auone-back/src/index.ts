import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import dispositivosRoutes from './routes/dispositivos.js';
import sensoresRoutes from './routes/sensores.js';
import usuariosRoutes from './routes/usuario.js';
import perfilRoutes from './routes/perfil.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração CORS
const corsOptions = {
  origin: '*', // Libera tudo pra todo mundo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // mude para false quando usar '*'
};


app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/dispositivos', dispositivosRoutes);
app.use('/api/sensores', sensoresRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use(perfilRoutes);

app.get('/', (req, res) => {
  res.send('🌿 API AUONE rodando com sucesso!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
