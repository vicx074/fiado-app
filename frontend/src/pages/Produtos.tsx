import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { produtoService } from '../services/produtoService';
import { Produto } from '../types';
import './styles/Produtos.css';

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoAtual, setProdutoAtual] = useState<Partial<Produto>>({
    nome: '',
    preco: 0,
    estoque: 0
  });
  const [modoEdicao, setModoEdicao] = useState(false);

  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await produtoService.listarProdutos();
      setProdutos(dados);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Não foi possível carregar os produtos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const abrirModal = (produto?: Produto) => {
    if (produto) {
      setProdutoAtual(produto);
      setModoEdicao(true);
    } else {
      setProdutoAtual({ nome: '', preco: 0, estoque: 0 });
      setModoEdicao(false);
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProdutoAtual({
      ...produtoAtual,
      [name]: name === 'nome' ? value : parseFloat(value)
    });
  };

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modoEdicao && produtoAtual.id) {
        await produtoService.atualizarProduto(produtoAtual.id, produtoAtual);
      } else {
        await produtoService.criarProduto(produtoAtual as Omit<Produto, 'id'>);
      }
      fecharModal();
      carregarProdutos();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      setError('Erro ao salvar produto. Tente novamente.');
    }
  };

  const excluirProduto = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      await produtoService.excluirProduto(id);
      carregarProdutos();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      setError('Erro ao excluir produto. Tente novamente.');
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  return (
    <Layout title="Produtos">
      {error && <div className="error-message">{error}</div>}

      <div className="actions">
        <button className="btn btn-success" onClick={() => abrirModal()}>
          Novo Produto
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
                <th>Preço</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                produtos.map((produto) => (
                  <tr key={produto.id}>
                    <td>{produto.nome}</td>
                    <td>{formatarMoeda(produto.preco)}</td>
                    <td className={produto.estoque <= 5 ? 'estoque-baixo' : ''}>
                      {produto.estoque}
                    </td>
                    <td className="acoes">
                      <button className="btn-icon" onClick={() => abrirModal(produto)}>
                        Editar
                      </button>
                      <button 
                        className="btn-icon btn-danger" 
                        onClick={() => excluirProduto(produto.id)}
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
              {modoEdicao ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <form onSubmit={salvarProduto}>
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={produtoAtual.nome || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="preco">Preço (R$)</label>
                <input
                  type="number"
                  id="preco"
                  name="preco"
                  step="0.01"
                  min="0"
                  value={produtoAtual.preco || 0}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="estoque">Estoque</label>
                <input
                  type="number"
                  id="estoque"
                  name="estoque"
                  min="0"
                  value={produtoAtual.estoque || 0}
                  onChange={handleInputChange}
                  required
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

export default Produtos; 