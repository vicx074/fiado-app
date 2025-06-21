import api from './api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  estabelecimento: string;
}

interface CadastroInput {
  nome: string;
  email: string;
  senha: string;
  estabelecimento: string;
}

export const authService = {
  login: async (email: string, senha: string): Promise<Usuario> => {
    const response = await api.post('/auth/login', { email, senha });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    return response.data.usuario;
  },

  cadastrar: async (dados: CadastroInput): Promise<Usuario> => {
    const response = await api.post('/auth/cadastro', dados);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    delete api.defaults.headers.common['Authorization'];
  },

  getUsuarioAtual: (): Usuario | null => {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  verificarToken: async (): Promise<boolean> => {
    try {
      const token = authService.getToken();
      if (!token) return false;
      
      await api.get('/auth/verificar');
      return true;
    } catch {
      authService.logout();
      return false;
    }
  }
};
