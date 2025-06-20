import api from './api';
import { Venda } from '../types';

interface VendaInput {
  cliente_id: number | null;
  valor?: number;
  itens?: Array<{
    produto_id: number;
    quantidade: number;
  }>;
}

export const vendaService = {
  listarVendas: async (): Promise<Venda[]> => {
    const response = await api.get('/relatorios/vendas');
    return response.data;
  },
  
  obterVenda: async (id: number): Promise<Venda> => {
    const response = await api.get(`/vendas/${id}`);
    return response.data;
  },
  
  criarVenda: async (venda: VendaInput): Promise<Venda> => {
    try {
      console.log('[DEBUG] Payload enviado para /vendas:', venda);
      const response = await api.post('/vendas', venda);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('[DEBUG] Erro do backend:', error.response.data);
      } else {
        console.error('[DEBUG] Erro desconhecido ao criar venda:', error);
      }
      throw error;
    }
  },
  
  excluirVenda: async (id: number): Promise<void> => {
    await api.delete(`/vendas/${id}`);
  }
};