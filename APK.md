# Gerar o app instalável (APK) com o EAS Build

Pré-requisito: backend publicado com HTTPS (veja DEPLOY.md).

1. Conta grátis em **expo.dev** e, no terminal (pasta `frontend`):
```
npm install -g eas-cli
eas login
```
2. Abra `eas.json` e troque `https://SEU-SERVICO.onrender.com` pelo endereço real do backend (nos dois perfis).
3. Gere o APK:
```
eas build -p android --profile preview
```
   - Se pedir o nome do pacote, use `com.commandiz.app` (já está no `app.json`).
   - Se perguntar sobre a chave de assinatura (keystore), aceite que o Expo crie.
   - Pode levar de 15 a 40 minutos (fila gratuita).
4. Ao terminar, aparece um **link e um QR Code** para baixar o `.apk`. Abra no celular e instale (o Android pode pedir para permitir "apps desconhecidos").
5. Teste o app instalado SEM o PC ligado e fora da sua rede Wi-Fi.

Para a Play Store: `eas build -p android --profile production` gera um arquivo `.aab` (e é preciso uma conta de desenvolvedor Google, que é paga).

Nada de `usesCleartextTraffic`: com HTTPS não é necessário.
