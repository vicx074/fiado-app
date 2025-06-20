import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { clienteService } from '../services/clienteService';
import { Cliente } from '../types';
import './styles/Clientes.css';

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteAtual, setClienteAtual] = useState<Partial<Cliente>>({
    nome: '',
    telefone: '',
    fiado: 0
  });
  const [modoEdicao, setModoEdicao] = useState(false);

  const carregarClientes = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await clienteService.listarClientes();
      setClientes(dados);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Não foi possível carregar os clientes. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const abrirModal = (cliente?: Cliente) => {
    if (cliente) {
      setClienteAtual(cliente);
      setModoEdicao(true);
    } else {
      setClienteAtual({ nome: '', telefone: '', fiado: 0 });
      setModoEdicao(false);
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClienteAtual({
      ...clienteAtual,
      [name]: name === 'fiado' ? parseFloat(value) : value
    });
  };

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modoEdicao && clienteAtual.id) {
        await clienteService.atualizarCliente(clienteAtual.id, clienteAtual);
      } else {
        await clienteService.criarCliente(clienteAtual as Omit<Cliente, 'id'>);
      }
      fecharModal();
      carregarClientes();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const excluirCliente = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await clienteService.excluirCliente(id);
      carregarClientes();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      setError('Erro ao excluir cliente. Tente novamente.');
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  return (
    <Layout title="Clientes">
      {error && <div className="error-message">{error}</div>}

      <div className="actions">
        <button className="btn btn-success" onClick={() => abrirModal()}>
          Novo Cliente
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Valor Fiado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.telefone || '-'}</td>
                    <td className={cliente.fiado > 0 ? 'valor-pendente' : ''}>
                      {formatarMoeda(cliente.fiado)}
                    </td>
                    <td className="acoes">
                      <button className="btn-icon" onClick={() => abrirModal(cliente)}>
                        Editar
                      </button>
                      <button 
                        className="btn-icon btn-danger" 
                        onClick={() => excluirCliente(cliente.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">
              {modoEdicao ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <form onSubmit={salvarCliente}>
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={clienteAtual.nome || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={clienteAtual.telefone || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fiado">Valor Fiado (R$)</label>
                <input
                  type="number"
                  id="fiado"
                  name="fiado"
                  step="0.01"
                  min="0"
                  value={clienteAtual.fiado || 0}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Clientes; 