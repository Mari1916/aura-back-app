
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import dispositivosRoutes from './routes/dispositivos.js';
import sensoresRoutes from './routes/sensores.js';
import usuariosRoutes from './routes/usuario.js';
import perfilRoutes from './routes/perfil.js';

// Carregar variáveis de ambiente do .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// Configuração de CORS
// --------------------------------------------------
const corsOptions = {
  origin: 'https://inpho3o-anonymous-8081.exp.direct', // ou '*', ou seu domínio de produção
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Aplica CORS para todas as rotas
app.use(cors(corsOptions));

// Permite requisições preflight (OPTIONS)
app.options('*', cors(corsOptions));

// --------------------------------------------------
// Middlewares para tratar requisições com payload
// --------------------------------------------------
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// --------------------------------------------------
// Rotas da aplicação
// --------------------------------------------------
app.use('/api/auth', authRoutes);                 // ex: POST /api/auth/cadastro
app.use('/api/dispositivos', dispositivosRoutes); // ex: GET /api/dispositivos
app.use('/api/sensores', sensoresRoutes);         // ex: GET /api/sensores
app.use('/api/usuarios', usuariosRoutes);         // ex: GET /api/usuarios/:id
app.use(perfilRoutes);                            // ex: GET /perfil

// --------------------------------------------------
// Rota raiz (teste rápido)
// --------------------------------------------------
app.get('/', (req, res) => {
  res.send('🌿 API AUONE rodando com sucesso!');
});

// --------------------------------------------------
// Inicialização do servidor
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
