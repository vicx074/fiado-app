import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { relatorioService } from '../services/relatorioService';
import { clienteService } from '../services/clienteService';
import { Cliente, Venda, ResumoRelatorio } from '../types';
import './styles/Relatorios.css';

const Relatorios: React.FC = () => {
  const [resumo, setResumo] = useState<ResumoRelatorio | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    inicio: '',
    fim: '',
    cliente_id: ''
  });
  
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [resumoData, vendasData, clientesData] = await Promise.all([
        relatorioService.obterResumo({
          inicio: filtros.inicio || undefined,
          fim: filtros.fim || undefined,
          cliente_id: filtros.cliente_id ? parseInt(filtros.cliente_id) : undefined
        }),
        relatorioService.listarVendas(),
        clienteService.listarClientes()
      ]);
      
      setResumo(resumoData);
      setVendas(vendasData);
      setClientes(clientesData);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar relatórios. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    carregarDados();
  };

  const limparFiltros = () => {
    setFiltros({
      inicio: '',
      fim: '',
      cliente_id: ''
    });
    // Recarregar dados sem filtros
    setTimeout(carregarDados, 0);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(data);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  return (
    <Layout title="Relatórios">
      {error && <div className="error-message">{error}</div>}

      <div className="card filtro-card">
        <h2 className="card-title">Filtros</h2>
        <form onSubmit={aplicarFiltros}>
          <div className="filtros-container">
            <div className="form-group">
              <label htmlFor="inicio">Data Início</label>
              <input
                type="date"
                id="inicio"
                name="inicio"
                value={filtros.inicio}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fim">Data Fim</label>
              <input
                type="date"
                id="fim"
                name="fim"
                value={filtros.fim}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cliente_id">Cliente</label>
              <select 
                id="cliente_id" 
                name="cliente_id" 
                value={filtros.cliente_id}
                onChange={handleFiltroChange}
              >
                <option value="">Todos os clientes</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filtro-actions">
            <button type="button" className="btn btn-secondary" onClick={limparFiltros}>
              Limpar Filtros
            </button>
            <button type="submit" className="btn btn-success">
              Aplicar Filtros
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          <div className="relatorio-section">
            <h2 className="section-title">Resumo</h2>
            <div className="stats-container">
              <div className="stat-card">
                <h3>Total de Vendas</h3>
                <p className="stat-value">{resumo?.total_vendas || 0}</p>
              </div>
              
              <div className="stat-card">
                <h3>Faturamento Total</h3>
                <p className="stat-value">
                  {formatarMoeda(resumo?.faturamento_total || 0)}
                </p>
              </div>

              {resumo?.produto_mais_vendido && (
                <div className="stat-card">
                  <h3>Produto Mais Vendido</h3>
                  <p className="stat-value-small">{resumo.produto_mais_vendido.nome}</p>
                  <p className="stat-detail">
                    {resumo.produto_mais_vendido.quantidade_vendida} unidades
                  </p>
                </div>
              )}
              
              {resumo?.cliente_mais_compras && (
                <div className="stat-card">
                  <h3>Cliente Com Mais Compras</h3>
                  <p className="stat-value-small">{resumo.cliente_mais_compras.nome}</p>
                  <p className="stat-detail">
                    {resumo.cliente_mais_compras.quantidade_compras} compras
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="relatorio-section">
            <h2 className="section-title">Histórico de Vendas</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        Nenhuma venda encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    vendas.map((venda) => (
                      <tr key={venda.id}>
                        <td>{formatarData(venda.data)}</td>
                        <td>{venda.cliente_nome || 'Cliente não cadastrado'}</td>
                        <td>{venda.itens.length} itens</td>
                        <td>{formatarMoeda(venda.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="relatorio-section">
            <h2 className="section-title">Clientes com Fiado Pendente</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Valor Fiado</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.filter(c => c.fiado > 0).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-state">
                        Nenhum cliente com fiado pendente.
                      </td>
                    </tr>
                  ) : (
                    clientes
                      .filter(cliente => cliente.fiado > 0)
                      .sort((a, b) => b.fiado - a.fiado)
                      .map((cliente) => (
                        <tr key={cliente.id}>
                          <td>{cliente.nome}</td>
                          <td>{cliente.telefone || '-'}</td>
                          <td className="valor-pendente">{formatarMoeda(cliente.fiado)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Relatorios; 