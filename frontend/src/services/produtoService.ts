import api from './api';
import { Produto } from '../types';

export const produtoService = {
  listarProdutos: async (): Promise<Produto[]> => {
    const response = await api.get('/produtos');
    return response.data;
  },
  
  obterProduto: async (id: number): Promise<Produto> => {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
  },
  
  criarProduto: async (produto: Omit<Produto, 'id'>): Promise<Produto> => {
    const response = await api.post('/produtos', produto);
    return response.data;
  },
  
  atualizarProduto: async (id: number, produto: Partial<Produto>): Promise<Produto> => {
    const response = await api.put(`/produtos/${id}`, produto);
    return response.data;
  },
  
  excluirProduto: async (id: number): Promise<void> => {
    await api.delete(`/produtos/${id}`);
  }
}; 