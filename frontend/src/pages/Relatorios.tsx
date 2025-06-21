import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { relatorioService } from '../services/relatorioService';
import { clienteService } from '../services/clienteService';
import { Cliente, Venda, ResumoRelatorio } from '../types';
import './styles/Relatorios.css';
import * as XLSX from 'xlsx';
// import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Search, Edit2, Trash2 /*, Edit*/ } from 'lucide-react';

const Relatorios: React.FC = () => {
  // const [resumo, setResumo] = useState<ResumoRelatorio | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    inicio: '',
    fim: '',
    cliente_id: ''
  });
  const [termoBusca, setTermoBusca] = useState('');
  // const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [clienteEditado, setClienteEditado] = useState<Cliente | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  // const [modalEditarValor, setModalEditarValor] = useState(false);
  // const [clienteValorEditando, setClienteValorEditando] = useState<Cliente | null>(null);
  // const [novoValorFiado, setNovoValorFiado] = useState('');
  
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
      
      // setResumo(resumoData);
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
  // const exportarVendasExcel = () => {
  //   const wsData = [
  //     ['Data', 'Cliente', 'Itens', 'Total'],
  //     ...vendas.map(venda => [
  //       formatarData(venda.data),
  //       venda.cliente_nome || 'Cliente não cadastrado',
  //       venda.itens?.length || 0,
  //       venda.valor || venda.total
  //     ])
  //   ];
  //   const ws = XLSX.utils.aoa_to_sheet(wsData);
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
  //   XLSX.writeFile(wb, 'relatorio_vendas.xlsx');
  // };

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
  // const vendasPorData = vendas.reduce((acc: Record<string, number>, venda) => {
  //   const data = formatarData(venda.data);
  //   acc[data] = (acc[data] || 0) + (venda.valor || venda.total || 0);
  //   return acc;
  // }, {});
  // const vendasChartData = Object.entries(vendasPorData).map(([data, total]) => ({ data, total }));

  // Encontrar maior valor de fiado
  const maiorFiado = clientes.reduce((max, c) => c.fiado > max ? c.fiado : max, 0);

  // const editarCliente = (cliente: Cliente) => {
  //   setClienteEditando(cliente);
  //   setClienteEditado({ ...cliente });
  //   setModalEditarAberto(true);
  // };

  const editarCliente = (cliente: Cliente) => {
    setClienteEditado({ ...cliente });
    setModalEditarAberto(true);
  };

  const salvarEdicaoCliente = async () => {
    if (!clienteEditado) return;
    try {
      await clienteService.atualizarCliente(clienteEditado.id, clienteEditado);
      setClientes(clientes.map(c => c.id === clienteEditado.id ? clienteEditado : c));
      setModalEditarAberto(false);
      // setClienteEditando(null);
    } catch (err) {
      alert('Erro ao salvar cliente.');
    }
  };

  const handleInputEditar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!clienteEditado) return;
    const { name, value } = e.target;
    setClienteEditado({ ...clienteEditado, [name]: value });
  };

  const excluirCliente = async (cliente: Cliente) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"? Essa ação é permanente!`)) {
      return;
    }
    try {
      await clienteService.excluirCliente(cliente.id);
      setClientes(clientes.filter(c => c.id !== cliente.id));
      setMensagemSucesso('Cliente excluído com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 2000);
    } catch (err) {
      setError('Erro ao excluir cliente. Tente novamente.');
    }
  };

  // Função para enviar cobrança via WhatsApp (abrindo o WhatsApp Web)
  const enviarCobrancaWhatsApp = (cliente: Cliente) => {
    const msg = `Olá, ${cliente.nome}! Você possui um fiado de ${formatarMoeda(cliente.fiado)} em aberto. Por favor, realize o pagamento. Obrigado!`;
    const url = `https://wa.me/55${cliente.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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
              <h2 className="section-title">Enviar Mensagem de Cobrança</h2>
              <button className="btn btn-export" onClick={exportarFiadoExcel} title="Exportar para Excel">Exportar Excel</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 18px 0', gap: 8 }}>
              <Search size={20} color="#888" />
              <input
                type="text"
                placeholder="Buscar cliente pelo nome..."
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid #ddd', fontSize: '1em', width: 260 }}
              />
            </div>
            {mensagemSucesso && (
              <div className="alert-success" style={{background:'#d4edda',border:'1.5px solid #c3e6cb',borderRadius:8,padding:'12px 18px',color:'#155724',marginBottom:16}}>
                {mensagemSucesso}
              </div>
            )}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Referência</th>
                    <th>Valor Fiado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.filter(c => c.fiado > 0 && c.nome.toLowerCase().includes(termoBusca.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        Nenhum cliente com fiado pendente.
                      </td>
                    </tr>
                  ) : (
                    clientes
                      .filter(cliente => cliente.fiado > 0 && cliente.nome.toLowerCase().includes(termoBusca.toLowerCase()))
                      .sort((a, b) => b.fiado - a.fiado)
                      .map((cliente) => (
                        <tr key={cliente.id} className={cliente.fiado === maiorFiado ? 'maior-fiado' : ''}>
                          <td>{cliente.nome}</td>
                          <td>{cliente.telefone || '-'}</td>
                          <td>{cliente.referencia || '-'}</td>
                          <td className="valor-pendente">{formatarMoeda(cliente.fiado)}
                            {cliente.fiado === maiorFiado && <span className="badge-maior">TOP</span>}
                            {cliente.telefone && (
                              <button
                                className="btn btn-whatsapp"
                                style={{ marginLeft: 10 }}
                                title="Enviar cobrança pelo WhatsApp"
                                onClick={() => enviarCobrancaWhatsApp(cliente)}
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
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 8 }}>
              <Search size={20} color="#888" />
              <input
                type="text"
                placeholder="Buscar cliente pelo nome..."
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid #ddd', fontSize: '1em', width: 260 }}
              />
            </div>
            <div className="table-container">
              <table className="data-table" style={{ border: 'none', background: 'none' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>Nome</th>
                    <th style={{ width: '40%' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.filter(c => c.nome.toLowerCase().includes(termoBusca.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="empty-state">
                        Nenhum cliente cadastrado.
                      </td>
                    </tr>
                  ) : (
                    clientes
                      .filter(c => c.nome.toLowerCase().includes(termoBusca.toLowerCase()))
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((cliente) => (
                        <tr key={cliente.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', margin: 8, height: 64 }}>
                          <td style={{ fontWeight: 600, fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ background: '#f1f5f9', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#2563eb' }}>
                              {cliente.nome[0].toUpperCase()}
                            </span>
                            {cliente.nome}
                          </td>
                          <td style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-start' }}>
                            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }} onClick={() => editarCliente(cliente)}>
                              <Edit2 size={18} /> Editar
                            </button>
                            <button className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }} onClick={() => excluirCliente(cliente)}>
                              <Trash2 size={18} /> Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            {modalEditarAberto && clienteEditado && (
              <div className="modal-backdrop">
                <div className="modal">
                  <h2 className="modal-title">Editar Cliente</h2>
                  <form onSubmit={e => { e.preventDefault(); salvarEdicaoCliente(); }}>
                    <div className="form-group">
                      <label htmlFor="nome">Nome</label>
                      <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={clienteEditado.nome}
                        onChange={handleInputEditar}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="telefone">Telefone</label>
                      <input
                        type="text"
                        id="telefone"
                        name="telefone"
                        value={clienteEditado.telefone}
                        onChange={handleInputEditar}
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setModalEditarAberto(false)}>
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
          </div>
        </>
      )}
    </Layout>
  );
};

export default Relatorios;