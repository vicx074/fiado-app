import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { vendaService } from '../services/vendaService';
import { clienteService } from '../services/clienteService';
import { produtoService } from '../services/produtoService';
import { Cliente, Produto, Venda } from '../types';
import './styles/Vendas.css';

interface ItemCarrinho {
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

const Vendas: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [vendasData, clientesData, produtosData] = await Promise.all([
        vendaService.listarVendas(),
        clienteService.listarClientes(),
        produtoService.listarProdutos()
      ]);
      
      setVendas(vendasData);
      setClientes(clientesData);
      setProdutos(produtosData);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirModal = () => {
    setClienteSelecionado(null);
    setCarrinho([]);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const adicionarItemCarrinho = () => {
    if (!produtoSelecionado || quantidade <= 0) return;

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    if (quantidade > produto.estoque) {
      setError(`Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}`);
      return;
    }

    const itemExistente = carrinho.findIndex(item => item.produto_id === produtoSelecionado);

    if (itemExistente >= 0) {
      const novaQuantidade = carrinho[itemExistente].quantidade + quantidade;
      
      if (novaQuantidade > produto.estoque) {
        setError(`Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}`);
        return;
      }

      const novosItens = [...carrinho];
      novosItens[itemExistente] = {
        ...novosItens[itemExistente],
        quantidade: novaQuantidade,
        subtotal: novaQuantidade * produto.preco
      };
      
      setCarrinho(novosItens);
    } else {
      setCarrinho([
        ...carrinho,
        {
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade: quantidade,
          preco_unitario: produto.preco,
          subtotal: quantidade * produto.preco
        }
      ]);
    }

    setProdutoSelecionado(null);
    setQuantidade(1);
    setError(null);
  };

  const removerItemCarrinho = (index: number) => {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  };

  const registrarVenda = async () => {
    if (!carrinho.length) {
      setError('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    try {
      await vendaService.criarVenda({
        cliente_id: clienteSelecionado,
        itens: carrinho.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade
        }))
      });

      fecharModal();
      const vendasAtualizadas = await vendaService.listarVendas();
      setVendas(vendasAtualizadas);
      
      // Atualizar estoque de produtos
      const produtosAtualizados = await produtoService.listarProdutos();
      setProdutos(produtosAtualizados);
      
      setError(null);
    } catch (err) {
      console.error('Erro ao registrar venda:', err);
      setError('Erro ao registrar venda. Verifique se há estoque suficiente.');
    }
  };

  const excluirVenda = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta venda?')) {
      return;
    }

    try {
      await vendaService.excluirVenda(id);
      
      // Atualizar lista de vendas
      const vendasAtualizadas = await vendaService.listarVendas();
      setVendas(vendasAtualizadas);
      
      // Atualizar estoque de produtos
      const produtosAtualizados = await produtoService.listarProdutos();
      setProdutos(produtosAtualizados);
      
      setError(null);
    } catch (err) {
      console.error('Erro ao excluir venda:', err);
      setError('Erro ao excluir venda. Tente novamente.');
    }
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + item.subtotal, 0);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  return (
    <Layout title="Vendas Fiado">
      {error && <div className="error-message">{error}</div>}

      <div className="actions">
        <button className="btn btn-success" onClick={abrirModal}>
          Nova Venda Fiado
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Valor Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Nenhuma venda registrada.
                  </td>
                </tr>
              ) : (
                vendas.map((venda) => (
                  <tr key={venda.id}>
                    <td>{formatarData(venda.data)}</td>
                    <td>{venda.cliente_nome || 'Cliente não cadastrado'}</td>
                    <td>{formatarMoeda(venda.total)}</td>
                    <td className="acoes">
                      <button className="btn-icon btn-danger" onClick={() => excluirVenda(venda.id)}>
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
          <div className="modal venda-modal">
            <h2 className="modal-title">Nova Venda Fiado</h2>
            
            <div className="form-group">
              <label htmlFor="cliente">Cliente</label>
              <select
                id="cliente"
                value={clienteSelecionado || ''}
                onChange={(e) => setClienteSelecionado(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Selecione um cliente (opcional)</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                ))}
              </select>
            </div>

            <div className="produto-selection">
              <div className="form-group">
                <label htmlFor="produto">Produto</label>
                <select
                  id="produto"
                  value={produtoSelecionado || ''}
                  onChange={(e) => setProdutoSelecionado(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Selecione um produto</option>
                  {produtos
                    .filter(produto => produto.estoque > 0)
                    .map(produto => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} - {formatarMoeda(produto.preco)} (Estoque: {produto.estoque})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group quantidade-group">
                <label htmlFor="quantidade">Quantidade</label>
                <input
                  type="number"
                  id="quantidade"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 0))}
                  min="1"
                />
              </div>

              <button 
                type="button" 
                className="btn"
                onClick={adicionarItemCarrinho}
                disabled={!produtoSelecionado}
              >
                Adicionar
              </button>
            </div>

            <h3>Itens do Carrinho</h3>
            {carrinho.length === 0 ? (
              <p className="empty-state">Nenhum item adicionado</p>
            ) : (
              <div className="carrinho-container">
                <table className="carrinho-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd</th>
                      <th>Preço</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrinho.map((item, index) => (
                      <tr key={index}>
                        <td>{item.produto_nome}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatarMoeda(item.preco_unitario)}</td>
                        <td>{formatarMoeda(item.subtotal)}</td>
                        <td>
                          <button 
                            className="btn-icon btn-danger" 
                            onClick={() => removerItemCarrinho(index)}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="total-label">Total:</td>
                      <td colSpan={2} className="total-value">{formatarMoeda(calcularTotal())}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={registrarVenda}
                disabled={carrinho.length === 0}
              >
                Registrar Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Vendas; 