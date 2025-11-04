Guia rápido para resolver o erro P1001 / "Can't reach database server" no Render

Objetivo
- Garantir que o serviço web consiga se conectar ao banco PostgreSQL hospedado no Render e aplicar as migrations com Prisma.

O que eu alterei no repositório
- Adicionei scripts npm úteis em `package.json`:
  - `npm run prisma:deploy` — aplica migrations no ambiente de produção (sem prompt)
  - `npm run start:deploy` — executa `prisma migrate deploy` e inicia o servidor (útil no processo de deploy)
  - `npm run test:pg` — executa `test-pg-conn.js` (teste rápido de conexão com `pg`)
- Adicionei `test-pg-conn.js` (arquivo de teste) que tenta conectar ao `DATABASE_URL` do `.env` e imprime o erro completo.

Passos a executar no painel do Render (eu não tenho acesso ao seu painel — execute estes passos lá)
1) Verificar o status do banco
   - Dashboard → Databases → selecione seu banco.
   - Verifique "Status" (deve ser "Running / Healthy").
   - Se estiver em maintenance/offline, clique em "Restart" / "Reboot" e aguarde 1-2 minutos.

2) Copiar a connection string correta e setar no Service
   - No Database → Connection details → copie a connection string (use o botão "Copy")
   - Vá em Services → selecione seu Service (auone-back) → Environment → adicion/edite `DATABASE_URL`
     - Cole a connection string exatamente como o Render fornece.
     - Certifique-se de incluir `?sslmode=require` se o Render recomendar.
   - Salve e faça um manual deploy do Service.

3) (Diagnóstico TLS) Variável temporária para testar verificação de certificado
   - Se após o passo 2 o erro persistir, adicione temporariamente no Service → Environment:
     - Key: `NODE_TLS_REJECT_UNAUTHORIZED`
     - Value: `0`
   - Redeploy o Service. Se resolver, o problema é verificação TLS do Node. NÃO deixe essa variável permanentemente em produção.

4) Usar `prisma migrate deploy` no deploy
   - Não use `npx prisma migrate dev` em produção. Use `npx prisma migrate deploy`.
   - No Render você pode configurar o comando de start do service para usar o script novo:
     - Build command: `npm install && npm run build`
     - Start command: `npm run start:deploy`
   - Isso garante que as migrations sejam aplicadas automaticamente no início do serviço.

5) Verificar métricas e limites de conexões
   - No Database → Metrics veja "Active connections". Se estiver no limite, novas conexões podem ser recusadas.
   - Se o limite for o problema, considere usar Prisma Data Proxy ou pgbouncer (para pooling).

Testes locais que você já pode rodar
- Testar conexão com driver `pg` (usa `.env`):
  1) `npm install pg --save-dev` (se ainda não tiver)
  2) `npm run test:pg`
  Saída esperada: "Conexão PG bem sucedida" ou um erro detalhado (ex.: ECONNRESET, ETIMEDOUT, ENOTFOUND).

- Testar Prisma introspection (local):
  - `npx prisma db pull`
  - Se der P1001, o problema é rede/DB inacessível.

Se o problema continuar após seguir os passos acima
- Cole aqui os logs completos do Service (Logs → último deploy) — especialmente a parte que mostra o erro do Prisma.
- Cole a saída de `npm run test:pg` (local) e `Test-NetConnection -ComputerName <host> -Port 5432` (PowerShell).

Precisa que eu faça alguma alteração de código adicional?
- Posso adicionar instruções para usar Prisma Data Proxy ou alterar o processo de deploy para rodar `migrate deploy` em CI.
- Posso também remover qualquer workaround TLS do código (recomendado) e instruir a usar a variável apenas no painel do Render para debug.

Quando você executar os passos no Render e colar os logs aqui eu continuo o diagnóstico e implemento a correção final.
