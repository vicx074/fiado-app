import api from './api';
import { Cliente, Produto, Venda, ResumoRelatorio } from '../types';

interface FiltroResumo {
  inicio?: string;
  fim?: string;
  cliente_id?: number;
}

export const relatorioService = {
  obterResumo: async (filtros?: FiltroResumo): Promise<ResumoRelatorio> => {
    const params = new URLSearchParams();
    if (filtros?.inicio) params.append('inicio', filtros.inicio);
    if (filtros?.fim) params.append('fim', filtros.fim);
    if (filtros?.cliente_id) params.append('cliente_id', String(filtros.cliente_id));
    
    const response = await api.get('/relatorios/resumo', { params });
    return response.data;
  },
  
  listarVendas: async (): Promise<Venda[]> => {
    const response = await api.get('/relatorios/vendas');
    return response.data;
  },
  
  listarClientes: async (): Promise<Cliente[]> => {
    const response = await api.get('/relatorios/clientes');
    return response.data;
  },
  
  listarProdutos: async (): Promise<Produto[]> => {
    const response = await api.get('/relatorios/produtos');
    return response.data;
  }
}; 