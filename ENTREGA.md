# Roteiro de demonstração e checklist de entrega

## Roteiro de demonstração (uns 8 minutos)
1. **Cliente novo:** criar conta, mostrar que o login fica guardado (fechar e abrir o app).
2. **Cardápio:** filtrar por categoria; tocar em um espeto (detalhes, quantidade, observação "sem cebola"); favoritar.
3. **Sobre a Casa:** horários, "aberto agora", telefone e avaliações.
4. **Carrinho:** ajustar quantidades, aplicar o cupom `BEMVINDO10`, ver o desconto.
5. **Pedido:** finalizar em dinheiro com troco (mostrar o cálculo do troco).
6. **Administrador** (outro celular ou o mesmo, com a conta listada em `ADMIN_EMAILS`): ver o pedido chegando, mudar para "Em preparo", "Pronto" e "Entregue".
7. **Cliente:** receber as notificações, ver o status mudando em Pedidos, **avaliar o pedido**.
8. **Clube:** ver os pontos ganhos, o nível e resgatar uma recompensa (vira um cupom).
9. **Perfil:** editar dados, trocar e-mail e senha; mostrar "Esqueci minha senha".
10. **Admin:** cadastrar um espeto novo (com foto) e um cupom; mostrar no app do cliente.

## Checklist antes de entregar
- [ ] `python -m pytest -v` (pasta `backend`) passou
- [ ] `git status` sem `.env` e sem `*.db`
- [ ] `SECRET_KEY` de produção diferente da de desenvolvimento
- [ ] `DEBUG_MODE=False` no servidor publicado
- [ ] README atualizado e com os nomes da equipe
- [ ] APK instalado e testado fora da rede de casa
- [ ] Link do backend (`/docs`) e do APK anotados na entrega
