export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  fiado: number;
  referencia?: string;
}

export interface Produto {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
}

export interface VendaItem {
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Venda {
  id: number;
  cliente_id: number | null;
  cliente_nome: string | null;
  data: string;
  total: number;
  valor: number;
  itens: VendaItem[];
}

export interface ResumoRelatorio {
  total_vendas: number;
  faturamento_total: number;
  produto_mais_vendido: {
    id: number;
    nome: string;
    quantidade_vendida: number;
  } | null;
  cliente_mais_compras: {
    id: number;
    nome: string;
    quantidade_compras: number;
  } | null;
}