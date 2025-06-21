import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { relatorioService } from '../services/relatorioService';
import { clienteService } from '../services/clienteService';
import { Cliente, Venda, ResumoRelatorio } from '../types';
import './styles/Relatorios.css';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

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

  // Função para exportar vendas para Excel
  const exportarVendasExcel = () => {
    const wsData = [
      ['Data', 'Cliente', 'Itens', 'Total'],
      ...vendas.map(venda => [
        formatarData(venda.data),
        venda.cliente_nome || 'Cliente não cadastrado',
        venda.itens?.length || 0,
        venda.valor || venda.total
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
    XLSX.writeFile(wb, 'relatorio_vendas.xlsx');
  };

  // Função para exportar clientes fiado para Excel
  const exportarFiadoExcel = () => {
    const wsData = [
      ['Nome', 'Telefone', 'Valor Fiado'],
      ...clientes.filter(c => c.fiado > 0).map(cliente => [
        cliente.nome,
        cliente.telefone || '-',
        cliente.fiado
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fiado');
    XLSX.writeFile(wb, 'clientes_fiado.xlsx');
  };

  // Preparar dados para o gráfico de vendas por data
  const vendasPorData = vendas.reduce((acc: Record<string, number>, venda) => {
    const data = formatarData(venda.data);
    acc[data] = (acc[data] || 0) + (venda.valor || venda.total || 0);
    return acc;
  }, {});
  const vendasChartData = Object.entries(vendasPorData).map(([data, total]) => ({ data, total }));

  // Encontrar maior valor de fiado
  const maiorFiado = clientes.reduce((max, c) => c.fiado > max ? c.fiado : max, 0);

  const editarCliente = (cliente: Cliente) => {
    // Implementar lógica de edição
    console.log('Editar cliente:', cliente);
  };

  const excluirCliente = (cliente: Cliente) => {
    // Implementar lógica de exclusão
    console.log('Excluir cliente:', cliente);
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
          {/* Removido Resumo e Histórico de Vendas */}
          <div className="relatorio-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title">Clientes com Fiado Pendente</h2>
              <button className="btn btn-export" onClick={exportarFiadoExcel} title="Exportar para Excel">Exportar Excel</button>
            </div>
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
                        <tr key={cliente.id} className={cliente.fiado === maiorFiado ? 'maior-fiado' : ''}>
                          <td>{cliente.nome}</td>
                          <td>{cliente.telefone || '-'}</td>
                          <td className="valor-pendente">{formatarMoeda(cliente.fiado)}
                            {cliente.fiado === maiorFiado && <span className="badge-maior">TOP</span>}
                            {cliente.telefone && (
                              <button
                                className="btn btn-whatsapp"
                                style={{ marginLeft: 10 }}
                                title="Enviar cobrança pelo WhatsApp"
                                onClick={() => {
                                  const msg = `Olá, ${cliente.nome}! Você possui um fiado de ${formatarMoeda(cliente.fiado)} em aberto. Por favor, realize o pagamento. Obrigado!`;
                                  const url = `https://wa.me/55${cliente.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                Enviar WhatsApp
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="relatorio-section" style={{ marginTop: 40 }}>
            <div className="alert-edicao" style={{background:'#f8d7da',border:'1.5px solid #f5c6cb',borderRadius:8,padding:'18px 20px',marginBottom:24}}>
              <strong style={{color:'#721c24',fontSize:'1.1em'}}>Atenção:</strong> Aqui você pode <b>editar</b> ou <b>excluir</b> clientes registrados. Essas ações são permanentes!
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="empty-state">
                        Nenhum cliente cadastrado.
                      </td>
                    </tr>
                  ) : (
                    clientes
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((cliente) => (
                        <tr key={cliente.id}>
                          <td style={{ fontWeight: 600 }}>{cliente.nome}</td>
                          <td>
                            <button className="btn btn-secondary" style={{marginRight:8}} onClick={() => editarCliente(cliente)}>
                              Editar
                            </button>
                            <button className="btn btn-danger" onClick={() => excluirCliente(cliente)}>
                              Excluir
                            </button>
                          </td>
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