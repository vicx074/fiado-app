import api from './api';
import { Venda } from '../types';

interface ItemVenda {
  produto_id: number;
  quantidade: number;
}

interface NovaVenda {
  cliente_id: number | null;
  itens: ItemVenda[];
}

export const vendaService = {
  listarVendas: async (): Promise<Venda[]> => {
    const response = await api.get('/relatorios/vendas');
    return response.data;
  },
  
  criarVenda: async (venda: NovaVenda): Promise<Venda> => {
    const response = await api.post('/vendas', venda);
    return response.data;
  },
  
  atualizarVenda: async (id: number, venda: NovaVenda): Promise<Venda> => {
    const response = await api.put(`/vendas/${id}`, venda);
    return response.data;
  },
  
  excluirVenda: async (id: number): Promise<void> => {
    await api.delete(`/vendas/${id}`);
  }
}; 