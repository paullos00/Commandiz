# Commandiz

O **Commandiz** é um aplicativo mobile para fazer e acompanhar pedidos de uma espetaria de forma simples, rápida e intuitiva. O projeto é um **MVP (Minimum Viable Product)** desenvolvido para fins acadêmicos.

## Documentações

- Plano de Desenvolvimento: https://docs.google.com/document/d/1BO4746ZQ5tLv2X2dCJk5gd72U82ts89vVApeRRpmYZA/edit?usp=sharing
- Design: https://www.figma.com/proto/hyFuuZluegND2tAl5HIbVP/App-Espeto-Brutus?node-id=0-1&t=2Bn07RZlxNjg0Ps4-1
- Como rodar o projeto: [COMO-RODAR.md](COMO-RODAR.md)
- Publicar o backend: [DEPLOY.md](DEPLOY.md) • Gerar o APK: [APK.md](APK.md) • Demonstração e entrega: [ENTREGA.md](ENTREGA.md)

## Funcionalidades

**Cliente**

- Cadastro, login seguro (senha + JWT), **recuperação de senha por e-mail** e perfil (dados, **troca de e-mail** e de senha)
- Cardápio com **categorias**, **detalhes do produto** (quantidade e observação) e fotos
- Favoritos e carrinho com ajuste de quantidade
- **Cupons de desconto** e fechamento do pedido com pagamento simulado (Pix, Cartão ou Dinheiro com cálculo de troco)
- Histórico de pedidos com **status em tempo real** e **notificações**
- **Avaliações** dos pedidos
- **Commandiz Club**: pontos, níveis e resgate de recompensas
- **Sobre a Casa**: horários, contato e "aberto agora"

**Administrador** (e-mails em `ADMIN_EMAILS`)

- Acompanhar pedidos e mudar o status (Recebido → Em preparo → Pronto → Entregue)
- Cadastrar e editar espetos, combos, categorias (com foto) e cupons

## Tecnologias

**App (`frontend/commandiz`)**

- Expo / React Native com TypeScript e Expo Router
- Axios (com interceptadores) e TanStack Query
- Expo SecureStore e Expo Constants
- Sentry (opcional)

**Backend (`backend`)**

- Python com FastAPI (documentação automática em `/docs`), Pydantic e pydantic-settings
- SQLAlchemy com SQLite (desenvolvimento) e PostgreSQL (produção)
- PyJWT e bcrypt (autenticação)
- Redis (cache e limite de tentativas) e Sentry (opcionais)
- Testes automáticos com pytest

## Plataforma

Android (testado com o Expo Go, SDK 54, e com APK gerado pelo EAS Build).
## ✅ Escopo do MVP

**Concluído:** tela inicial, cardápio com categorias, detalhes do produto,
carrinho com quantidade e cupom, checkout simulado com forma de pagamento,
histórico de pedidos, promoções, perfil/Commandiz Club e sobre a casa.

**Próxima versão:** favoritos, notificações em tempo real
e avaliações de pedidos.

## 👥 Equipe
- Giulia Zacharias Belatini
- João Pedro da Silva Santos
- Leticia Andrade de Carvalho
- Nicolas Ribeiro Campos
- Paulo Sérgio Andrade dos Santos

## Licença

Este projeto foi desenvolvido para fins acadêmicos. Veja o arquivo [LICENSE](LICENSE).
