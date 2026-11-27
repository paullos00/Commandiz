# Publicar o backend (Render + PostgreSQL)

Resultado: a API fica online com HTTPS (`https://commandiz-api.onrender.com`, por exemplo) e o app funciona em qualquer rede.

## 1. Pré-requisitos
- Projeto no **GitHub** (sem `.env` e sem `*.db`; o `.gitignore` já protege).
- Conta no **render.com** ligada ao GitHub.

## 2. Subir o código para o GitHub
```
git init
git add .
git commit -m "Commandiz completo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/commandiz.git
git push -u origin main
```
Antes do `git add .`, confirme com `git status` que **não aparecem** `.env` nem `espetaria.db`.

## 3. Criar tudo no Render (Blueprint)
1. Render → **New** → **Blueprint** → escolha o repositório (ele lê o `render.yaml`).
2. Preencha os valores pedidos: `ADMIN_EMAILS` (seu e-mail), e os opcionais (`SENTRY_DSN`, `REDIS_URL`, `SMTP_*`; pode deixar em branco).
3. **Apply**. Espere o deploy terminar (alguns minutos).

## 4. Conferir
- `https://SEU-SERVICO.onrender.com/saude` → `{"api":"ok","redis":"..."}`
- `https://SEU-SERVICO.onrender.com/docs` → Swagger

## 5. Apontar o app
No `frontend/.env`: `EXPO_PUBLIC_API_URL=https://SEU-SERVICO.onrender.com` e reinicie o Expo (`npx expo start -c`).

## Cuidados
- Planos gratuitos "dormem" após um tempo sem uso: o primeiro acesso pode levar cerca de 1 minuto.
- Confira no site do Render os limites atuais do banco gratuito (pode ter prazo de validade).
- O banco novo começa vazio: o servidor recria cardápio, categorias e cupons de exemplo. Crie sua conta no app e coloque o seu e-mail em `ADMIN_EMAILS` para virar administrador.
- Em produção mantenha `DEBUG_MODE=False`.
