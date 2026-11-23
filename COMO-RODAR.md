# Como rodar o Commandiz do zero (Windows + VS Code)

O projeto tem **duas partes** que rodam ao mesmo tempo, cada uma no seu terminal:

| Parte | Pasta | O que é |
|---|---|---|
| Backend (a "cozinha") | `backend` | API em Python (FastAPI) que guarda cardápio, clientes e pedidos |
| App (o "cardápio") | `frontend/commandiz` | App de celular em Expo (React Native) |

## Parte 0: Instalar os programas (uma vez só)

| Programa | Onde baixar | Cuidados |
|---|---|---|
| VS Code | code.visualstudio.com | — |
| Python 3.12 ou mais novo | python.org | Na 1ª tela do instalador, marque **"Add python.exe to PATH"** |
| Node.js (versão **LTS**, 20.19 ou mais nova) | nodejs.org | — |
| Expo Go **versão SDK 54** (no celular Android) | `https://expo.dev/go?sdkVersion=54&platform=android&device=true` | Se o Expo Go da Play Store for SDK 58, desinstale e instale este. **Não atualize** pela Play Store |

Confira no terminal (aperte a tecla Windows, digite `cmd`, Enter):

```
python --version
node --version
```

Os dois precisam mostrar um número de versão.

## Parte 1: Abrir o projeto no VS Code

1. Extraia o `.zip` em uma pasta simples, de preferência sem acentos e sem espaços (ex.: `C:\Projetos\comandiz`).
2. No VS Code: **File → Open Folder** → escolha a pasta `comandiz` (a que tem `backend` e `frontend`).
3. Abra o terminal: **Terminal → New Terminal**. Ele já abre dentro da pasta `comandiz`.

## Parte 2: Ligar o backend (Terminal 1)

```
cd backend
python -m pip install -r requirements.txt
cp .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

1. O último comando mostra um texto comprido. **Copie-o.**
2. Abra o arquivo `backend/.env` no VS Code e cole o texto depois de `SECRET_KEY=` (sem aspas, sem espaços). Deixe `SENTRY_DSN` e `REDIS_URL` vazios. Salve com **Ctrl + S**.
3. Ligue o servidor:

```
python main.py
```

Deve aparecer `Application startup complete`. **Deixe este terminal aberto.**

Teste no navegador do PC:

- `http://localhost:5000/docs` abre a documentação (Swagger)
- `http://localhost:5000/espetos` mostra os espetos
- `http://localhost:5000/saude` mostra `{"api":"ok","redis":"desligado"}` (normal sem Redis)

Se o Windows perguntar sobre o **Firewall**, clique em **Permitir acesso**.

## Parte 3: Descobrir o IP do computador

Abra um novo terminal (botão **+**) e rode:

```
ipconfig
```

Procure **"Endereço IPv4"** do **Wi-Fi**. Precisa começar com `192.168.` (ou `10.`). Anote (ex.: `192.168.1.93`).

Teste no navegador do **celular** (mesmo Wi-Fi), com `http://` e sem "s":

```
http://192.168.1.93:5000/espetos
```

Se aparecer a lista, o celular enxerga o PC.

## Parte 4: Ligar o app (Terminal 2)

No novo terminal:

```
cd frontend/commandiz
npm install
cp .env.example .env
```

1. O `npm install` demora alguns minutos na primeira vez.
2. Instale os pacotes do **QR Code do Pix** (uma vez só):

```
npx expo install react-native-svg expo-clipboard
npm install react-native-qrcode-svg
```

3. Abra `frontend/commandiz/.env` e troque o IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.93:5000
```

4. Ligue o app:

```
npx expo start -c
```

Se aparecer o erro `Body is unusable`, use `npx expo start -c --offline`.

5. No celular: abra o **Expo Go** → **Scan QR code** → escaneie o QR Code do terminal.

## Parte 5: Usar como cliente

1. **Criar conta** (senha com 6+ caracteres).
2. Favoritar espetos com o coração.
3. Adicionar itens ao carrinho e ajustar as quantidades.
4. **Finalizar pedido** (Pix, Cartão ou Dinheiro com troco).
5. Ver o histórico na aba **Pedidos** e editar os dados em **"Olá, [nome]"**.

Para ver o app como o usuário final (sem os recursos de desenvolvimento): `npx expo start --no-dev --minify`.

## Nos dias seguintes

São só dois terminais, sempre nestas pastas:

| Terminal | Comandos |
|---|---|
| 1 | `cd backend` e `python main.py` |
| 2 | `cd frontend/commandiz` e `npx expo start -c` |

Se o IP do PC mudar, atualize o `frontend/commandiz/.env`.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `python` não é reconhecido | Reinstale o Python marcando "Add python.exe to PATH" |
| `No module named ...` | Rode `python -m pip install -r requirements.txt` na pasta `backend` |
| `SECRET_KEY ... Field required` | Falta a linha `SECRET_KEY=` no `backend/.env` |
| Expo: `package.json does not exist` | Você está na pasta errada. Entre em `frontend/commandiz` |
| Expo Go: "incompatible SDK" | O Expo Go precisa ser o de **SDK 54** (link da Parte 0) |
| App: "Não consegui falar com o servidor" | Backend desligado, IP errado no `.env` do app, ou celular em outra rede Wi-Fi |
| O celular não abre `http://IP:5000` | Libere o Python no Firewall do Windows e use `http://` (sem "s") |
| Mudei o `.env` e nada mudou | Reinicie o Expo: Ctrl + C e `npx expo start -c` |

## Administrador

Para ver o painel de administrador no app, coloque o e-mail da sua conta (que já precisa existir) no `backend/.env`:

```
ADMIN_EMAILS=seu@email.com
```

Reinicie o backend e saia e entre de novo no app: aparece o botão **🛠 Admin** no topo.

## Pix (QR Code)

No `backend/.env`, coloque a chave Pix que **recebe** os pagamentos:

```
PIX_CHAVE=sua-chave-pix
PIX_NOME_RECEBEDOR=Nome da Espetaria
PIX_CIDADE=Sua Cidade
```

Chave: CPF/CNPJ só com números, e-mail, celular no formato `+5511999999999` ou chave aleatória. Sem `PIX_CHAVE`, o pedido em Pix funciona, mas sem QR Code.

## Opcionais

- **Sentry** (relatório de erros): preencha `SENTRY_DSN` (backend) e `EXPO_PUBLIC_SENTRY_DSN` (app).
- **Redis** (cache e limite de tentativas de login): preencha `REDIS_URL` no backend (ex.: banco grátis no upstash.com).
- **E-mail** ("Esqueci minha senha"): preencha `SMTP_*` no backend. Sem isso, o código aparece no terminal do backend (com `DEBUG_MODE=True`).
- **Testes:** `cd backend`, `python -m pip install -r requirements-dev.txt` e `python -m pytest -v`.

Os arquivos `.env` guardam segredos e **nunca** devem ir para o GitHub. O `.gitignore` já os protege.
