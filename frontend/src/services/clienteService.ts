import api from './api';
import { Cliente } from '../types';

interface ClienteInput {
  nome: string;
  telefone: string;
  fiado: number;
  referencia?: string;
}

export const clienteService = {
  listarClientes: async (): Promise<Cliente[]> => {
    const response = await api.get('/clientes');
    return response.data;
  },
  
  obterCliente: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },
  
  criarCliente: async (cliente: ClienteInput): Promise<Cliente> => {
    const response = await api.post('/clientes', cliente);
    return response.data;
  },
  
  atualizarCliente: async (id: number, cliente: Partial<ClienteInput>): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data;
  },
  
  excluirCliente: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  }
}; 