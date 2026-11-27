// O "garçom" (Axios): todas as telas pedem as coisas ao backend por aqui.

import axios from "axios";

import { API_URL, EM_PRODUCAO, VERSAO_APP } from "../constants/config";
import { relatarErro } from "./monitoramento";
import { limparSessao, lerToken } from "./sessao";

// Permite marcar uma requisição com { skipGlobalHandler: true } para o
// tratamento global de erros (interceptador) não se meter.
declare module "axios" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export interface AxiosRequestConfig<D = any> {
    skipGlobalHandler?: boolean;
  }
}

export type Espeto = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  categoria_id: number | null;
};

export type Categoria = {
  id: number;
  nome: string;
  ordem: number;
  visivel: boolean;
};

export type Combo = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_original: number | null;
  imagem: string | null;
};

export type Cliente = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  foto?: string | null;
  admin?: boolean; // true se for administrador
};

export type NovoRegistro = {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
};

export type RespostaAuth = {
  access_token: string;
  token_type: string;
  cliente: Cliente;
};

export type ItemCarrinho = {
  id: number;
  espeto_id: number | null;
  combo_id: number | null;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  observacao: string | null;
};

export type Carrinho = {
  cliente_id: number;
  itens: ItemCarrinho[];
  total: number;
};

// Envie espeto_id OU combo_id (nunca os dois).
export type NovoItem = {
  espeto_id?: number;
  combo_id?: number;
  quantidade?: number;
  observacao?: string; // ex.: "sem cebola" (até 140 letras)
};

export type FormaPagamento = "dinheiro" | "pix" | "cartao";

export type ItemPedido = {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  observacao: string | null;
};

export type Horario = {
  dia: string;
  abre: string | null; // "18:00"; null = fechado
  fecha: string | null;
};

export type Casa = {
  nome: string;
  descricao: string;
  endereco: string;
  telefone: string;
  horarios: Horario[];
};

export type Avaliacao = {
  nota: number;
  comentario: string | null;
  criado_em: string;
};

export type AvaliacaoPublica = Avaliacao & { nome: string };

export type ResumoAvaliacoes = {
  media: number;
  total: number;
  recentes: AvaliacaoPublica[];
};

export type CupomDisponivel = {
  codigo: string;
  descricao: string;
  tipo: "percentual" | "valor";
  valor: number;
  minimo: number;
  validade: string | null;
};

export type ValidacaoCupom = {
  codigo: string;
  descricao: string;
  desconto: number;
  subtotal: number;
  total: number;
};

export type Notificacao = {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
};

export type ListaNotificacoes = {
  nao_lidas: number;
  itens: Notificacao[];
};

export type Recompensa = { id: string; titulo: string; custo: number };

export type MovimentoPontos = { pontos: number; motivo: string; criado_em: string };

export type Clube = {
  pontos: number;
  ganhos_totais: number;
  nivel: string;
  proximo_nivel: string | null;
  faltam: number;
  progresso: number; // 0 a 1
  recompensas: Recompensa[];
  historico: MovimentoPontos[];
};

export type Resgate = { codigo: string; descricao: string; validade: string };

// ----- Administração -----
export type EspetoAdmin = Espeto & { ativo: boolean | null };
export type ComboAdmin = Combo & { ativo: boolean | null };
export type CardapioAdmin = { espetos: EspetoAdmin[]; combos: ComboAdmin[]; categorias: Categoria[] };

export type ProdutoAdminIn = {
  nome?: string;
  descricao?: string;
  preco?: number;
  preco_original?: number | null;
  imagem?: string;
  categoria_id?: number | null;
  ativo?: boolean;
};

export type CupomAdmin = {
  id: number;
  codigo: string;
  descricao: string;
  tipo: "percentual" | "valor";
  valor: number;
  minimo: number;
  validade: string | null;
  limite_usos: number | null;
  usos: number;
  ativo: boolean;
  cliente_id: number | null;
};

export type CupomAdminIn = {
  codigo: string;
  descricao?: string;
  tipo: "percentual" | "valor";
  valor: number;
  minimo?: number;
  validade_dias?: number;
  limite_usos?: number;
};

export type Pedido = {
  id: number;
  status: string;
  forma_pagamento: FormaPagamento;
  total: number;
  valor_pago: number | null; // só no pagamento em dinheiro
  troco: number | null; // só no pagamento em dinheiro
  cupom_codigo: string | null;
  desconto: number | null;
  criado_em: string; // data em formato ISO, ex.: "2026-10-29T15:30:00Z"
  itens: ItemPedido[];
  avaliacao: Avaliacao | null;
  pix_copia_cola: string | null; // código do Pix (só em pedidos Pix)
};

export type PedidoAdmin = Pedido & { cliente_nome: string; cliente_telefone: string; proximos: string[] };

// Dados para fechar o pedido. Para "dinheiro", informe se precisa de troco
// e (se precisar) com quanto o cliente vai pagar.
export type NovoPedido = {
  forma_pagamento: FormaPagamento;
  precisa_troco?: boolean;
  valor_pago?: number;
  cupom?: string; // código do cupom de desconto
};

export type DadosPerfil = { nome: string; telefone: string; foto?: string | null };
export type TrocaDeSenha = { senha_atual: string; senha_nova: string };

type Mensagem = { mensagem: string };

// Erro com o código HTTP junto (401 = precisa logar, 404 = não encontrado,
// 409 = e-mail repetido...). status 0 = nem chegou no servidor.
export class ApiError extends Error {
  status: number;
  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

// A tela principal avisa aqui o que fazer quando a sessão expira.
let aoExpirarSessao: (() => void) | null = null;
export function definirAoExpirarSessao(funcao: (() => void) | null) {
  aoExpirarSessao = funcao;
}

function registrarErro(erro: ApiError, url?: string) {
  // Em desenvolvimento mostramos detalhes no console; em produção, não.
  if (!EM_PRODUCAO) {
    console.log(`[API] erro ${erro.status} em ${url ?? "?"}: ${erro.message}`);
  }
}

// Erros do usuário (senha errada, item não encontrado...) não vão para o Sentry:
// só falhas de rede (status 0) e erros do servidor (500 ou mais).
function relatarSeGrave(erro: ApiError, url?: string) {
  if (erro.status === 0 || erro.status >= 500) {
    relatarErro(erro, { url, status: erro.status });
  }
}

const http = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos (servidores gratuitos demoram para "acordar"): depois disso, mostra erro
  headers: { "Content-Type": "application/json", "X-App-Version": VERSAO_APP },
});

// Interceptador de SAÍDA: roda antes de cada pedido sair do celular.
http.interceptors.request.use(async (config) => {
  if (!API_URL) {
    throw new ApiError("EXPO_PUBLIC_API_URL não configurada (veja o arquivo .env)", 0);
  }

  // O token (JWT) do login vai junto em todo pedido.
  const token = await lerToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Interceptador de CHEGADA: roda em toda resposta com erro e a transforma
// em uma mensagem humana (o backend sempre manda {"erro": "..."}).
http.interceptors.response.use(
  (resposta) => resposta,
  async (erro: unknown) => {
    if (!axios.isAxiosError<{ erro?: string }>(erro)) {
      throw erro;
    }

    let apiError: ApiError;
    if (erro.response) {
      apiError = new ApiError(erro.response.data?.erro ?? "Erro de comunicação", erro.response.status);
    } else if (erro.code === "ECONNABORTED") {
      apiError = new ApiError("O servidor demorou demais para responder. Tente de novo.", 0);
    } else {
      apiError = new ApiError("Não consegui falar com o servidor. Ele está ligado? O IP está certo?", 0);
    }

    // Falhas de rede e erros do servidor sempre vão para o Sentry,
    // mesmo nas chamadas "silenciosas" (skipGlobalHandler).
    relatarSeGrave(apiError, erro.config?.url);

    if (!erro.config?.skipGlobalHandler) {
      registrarErro(apiError, erro.config?.url);

      // 401 fora do login = token vencido ou inválido: limpa a sessão e avisa a tela.
      if (apiError.status === 401) {
        await limparSessao();
        aoExpirarSessao?.();
      }
    }
    throw apiError;
  },
);

export const api = {
  // Públicas
  listarEspetos: () => http.get<Espeto[]>("/espetos").then((r) => r.data),
  listarCombos: () => http.get<Combo[]>("/combos").then((r) => r.data),
  infoCasa: () => http.get<Casa>("/casa").then((r) => r.data),
  listarCategorias: () => http.get<Categoria[]>("/categorias").then((r) => r.data),

  // Autenticação (401 aqui significa "senha errada", não "sessão expirada")
  registrar: (dados: NovoRegistro) =>
    http.post<RespostaAuth>("/auth/registrar", dados, { skipGlobalHandler: true }).then((r) => r.data),
  login: (email: string, senha: string) =>
    http.post<RespostaAuth>("/auth/login", { email, senha }, { skipGlobalHandler: true }).then((r) => r.data),
  eu: () => http.get<Cliente>("/auth/me", { skipGlobalHandler: true }).then((r) => r.data),

  // Carrinho (precisa de login)
  verCarrinho: (clienteId: number) =>
    http.get<Carrinho>(`/clientes/${clienteId}/carrinho`).then((r) => r.data),
  adicionarAoCarrinho: (clienteId: number, item: NovoItem) =>
    http
      .post<Mensagem & { item_id: number }>(`/clientes/${clienteId}/carrinho/itens`, item)
      .then((r) => r.data),
  mudarQuantidade: (itemId: number, quantidade: number) =>
    http.patch<Mensagem>(`/carrinho/itens/${itemId}`, { quantidade }).then((r) => r.data),
  removerItem: (itemId: number) =>
    http.delete<Mensagem>(`/carrinho/itens/${itemId}`).then((r) => r.data),
  limparCarrinho: (clienteId: number) =>
    http.delete<Mensagem>(`/clientes/${clienteId}/carrinho`).then((r) => r.data),

  // Favoritos (precisa de login)
  listarFavoritos: (clienteId: number) =>
    http.get<Espeto[]>(`/clientes/${clienteId}/favoritos`).then((r) => r.data),
  favoritar: (clienteId: number, espetoId: number) =>
    http.post<Mensagem>(`/clientes/${clienteId}/favoritos`, { espeto_id: espetoId }).then((r) => r.data),
  desfavoritar: (clienteId: number, espetoId: number) =>
    http.delete<Mensagem>(`/clientes/${clienteId}/favoritos/${espetoId}`).then((r) => r.data),

  // Pedidos (precisa de login)
  fecharPedido: (clienteId: number, dados: NovoPedido) =>
    http.post<Pedido>(`/clientes/${clienteId}/pedidos`, dados).then((r) => r.data),
  listarPedidos: (clienteId: number) =>
    http.get<Pedido[]>(`/clientes/${clienteId}/pedidos`).then((r) => r.data),

  // Administração (só administradores)
  adminPedidos: (somenteAtivos: boolean) =>
    http.get<PedidoAdmin[]>("/admin/pedidos", { params: { somente_ativos: somenteAtivos } }).then((r) => r.data),
  adminMudarStatus: (pedidoId: number, status: string) =>
    http.patch<PedidoAdmin>(`/admin/pedidos/${pedidoId}/status`, { status }).then((r) => r.data),
  adminCardapio: () => http.get<CardapioAdmin>("/admin/cardapio").then((r) => r.data),
  adminCriarProduto: (tipo: "espeto" | "combo", dados: ProdutoAdminIn) =>
    http.post(`/admin/${tipo === "espeto" ? "espetos" : "combos"}`, dados).then((r) => r.data),
  adminAtualizarProduto: (tipo: "espeto" | "combo", id: number, dados: ProdutoAdminIn) =>
    http.patch(`/admin/${tipo === "espeto" ? "espetos" : "combos"}/${id}`, dados).then((r) => r.data),
  adminExcluirProduto: (tipo: "espeto" | "combo", id: number) =>
    http.delete<Mensagem>(`/admin/${tipo === "espeto" ? "espetos" : "combos"}/${id}`).then((r) => r.data),
  adminCriarCategoria: (nome: string, visivel: boolean) =>
    http.post<Categoria>("/admin/categorias", { nome, visivel }).then((r) => r.data),
  adminExcluirCategoria: (id: number) => http.delete<Mensagem>(`/admin/categorias/${id}`).then((r) => r.data),
  adminCupons: () => http.get<CupomAdmin[]>("/admin/cupons").then((r) => r.data),
  adminCriarCupom: (dados: CupomAdminIn) => http.post<CupomAdmin>("/admin/cupons", dados).then((r) => r.data),
  adminAtualizarCupom: (id: number, dados: { ativo?: boolean }) =>
    http.patch<CupomAdmin>(`/admin/cupons/${id}`, dados).then((r) => r.data),

  // Commandiz Club
  verClube: (clienteId: number) => http.get<Clube>(`/clientes/${clienteId}/clube`).then((r) => r.data),
  resgatarRecompensa: (clienteId: number, recompensaId: string) =>
    http.post<Resgate>(`/clientes/${clienteId}/clube/resgatar`, { recompensa_id: recompensaId }).then((r) => r.data),

  // Notificações
  listarNotificacoes: (clienteId: number) =>
    http.get<ListaNotificacoes>(`/clientes/${clienteId}/notificacoes`).then((r) => r.data),
  marcarNotificacoesLidas: (clienteId: number) =>
    http.post<Mensagem>(`/clientes/${clienteId}/notificacoes/lidas`).then((r) => r.data),

  // Cupons
  validarCupom: (clienteId: number, codigo: string) =>
    http
      .post<ValidacaoCupom>(`/clientes/${clienteId}/cupons/validar`, { codigo }, { skipGlobalHandler: true })
      .then((r) => r.data),
  cuponsDisponiveis: (clienteId: number) =>
    http.get<CupomDisponivel[]>(`/clientes/${clienteId}/cupons`).then((r) => r.data),

  // Avaliações
  resumoAvaliacoes: () => http.get<ResumoAvaliacoes>("/avaliacoes").then((r) => r.data),
  avaliarPedido: (clienteId: number, pedidoId: number, dados: { nota: number; comentario?: string }) =>
    http.post<Avaliacao>(`/clientes/${clienteId}/pedidos/${pedidoId}/avaliacao`, dados).then((r) => r.data),

  // Conta: recuperar senha (sem login) e trocar e-mail
  recuperarSenha: (email: string) =>
    http.post<Mensagem>("/auth/recuperar", { email }, { skipGlobalHandler: true }).then((r) => r.data),
  redefinirSenha: (dados: { email: string; codigo: string; senha_nova: string }) =>
    http.post<Mensagem>("/auth/redefinir", dados, { skipGlobalHandler: true }).then((r) => r.data),
  alterarEmail: (dados: { email_novo: string; senha: string }) =>
    http.put<Cliente>("/auth/email", dados).then((r) => r.data),

  // Perfil (precisa de login)
  atualizarPerfil: (dados: DadosPerfil) => http.patch<Cliente>("/auth/me", dados).then((r) => r.data),
  trocarSenha: (dados: TrocaDeSenha) => http.put<Mensagem>("/auth/senha", dados).then((r) => r.data),
};

export function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}