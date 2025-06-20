import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { vendaService } from '../services/vendaService';
import { clienteService } from '../services/clienteService';
import { Cliente, Venda } from '../types';
import { ShoppingCart, Plus, Edit, Trash2, Check, User } from 'lucide-react';
import './styles/Vendas.css';

interface NovoCliente {
  nome: string;
  telefone: string;
  referencia: string;
}

interface NovoFiado {
  cliente_id: number | null;
  valor: number;
}

const Vendas: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [modalEditarClienteAberto, setModalEditarClienteAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [valorFiado, setValorFiado] = useState<number>(0);
  const [novoCliente, setNovoCliente] = useState<NovoCliente>({ 
    nome: '', 
    telefone: '', 
    referencia: '' 
  });

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [vendasData, clientesData] = await Promise.all([
        vendaService.listarVendas(),
        clienteService.listarClientes()
      ]);
      
      setVendas(vendasData);
      setClientes(clientesData);
      setError(null);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
    setValorFiado(0);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const abrirModalCliente = () => {
    setNovoCliente({ nome: '', telefone: '', referencia: '' });
    setModalClienteAberto(true);
  };

  const fecharModalCliente = () => {
    setModalClienteAberto(false);
  };

  const abrirModalEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalEditarClienteAberto(true);
  };

  const fecharModalEditarCliente = () => {
    setClienteEditando(null);
    setModalEditarClienteAberto(false);
  };

  const registrarFiado = async () => {
    if (valorFiado <= 0) {
      setError('Informe um valor válido para o fiado.');
      return;
    }

    if (!clienteSelecionado) {
      setError('Selecione um cliente para registrar o fiado.');
      return;
    }

    try {
      // Registrar a venda fiado com o valor diretamente
      await vendaService.criarVenda({
        cliente_id: clienteSelecionado,
        valor: valorFiado
      });

      fecharModal();
      await carregarDados();
    } catch (err) {
      console.error('Erro ao registrar fiado:', err);
      setError('Erro ao registrar fiado. Tente novamente.');
    }
  };

  const salvarNovoCliente = async () => {
    if (!novoCliente.nome) {
      setError('Nome do cliente é obrigatório');
      return;
    }

    try {
      const cliente = await clienteService.criarCliente({
        nome: novoCliente.nome,
        telefone: novoCliente.telefone,
        referencia: novoCliente.referencia,
        fiado: 0
      });

      const clientesAtualizados = [...clientes, cliente];
      setClientes(clientesAtualizados);
      setClienteSelecionado(cliente.id);
      
      fecharModalCliente();
      setError(null);
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const atualizarCliente = async () => {
    if (!clienteEditando) return;
    if (!clienteEditando.nome) {
      setError('Nome do cliente é obrigatório');
      return;
    }

    try {
      const clienteAtualizado = await clienteService.atualizarCliente(clienteEditando.id, {
        nome: clienteEditando.nome,
        telefone: clienteEditando.telefone,
        referencia: clienteEditando.referencia
      });

      setClientes(clientes.map(c => c.id === clienteEditando.id ? clienteAtualizado : c));
      fecharModalEditarCliente();
      setError(null);
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      setError('Erro ao atualizar cliente. Tente novamente.');
    }
  };

  const handleInputNovoCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNovoCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleInputEditarCliente = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!clienteEditando) return;
    const { name, value } = e.target;
    setClienteEditando(prev => ({ ...prev!, [name]: value }));
  };

  const marcarComoPago = async (vendaId: number) => {
    const venda = vendas.find(v => v.id === vendaId);
    if (!venda || !venda.cliente_id) return;

    try {
      await vendaService.excluirVenda(vendaId);
      setVendas(vendas.filter(v => v.id !== vendaId));
      setError(null);
    } catch (err) {
      console.error('Erro ao marcar como pago:', err);
      setError('Erro ao marcar venda como paga. Tente novamente.');
    }
  };

  const excluirVenda = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta venda?')) {
      return;
    }

    try {
      await vendaService.excluirVenda(id);
      setVendas(vendas.filter(v => v.id !== id));
    } catch (err) {
      console.error('Erro ao excluir venda:', err);
      setError('Erro ao excluir venda. Tente novamente.');
    }
  };

  // NOVA FUNÇÃO: Excluir cliente
  const excluirCliente = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.')) {
      return;
    }
    try {
      await clienteService.excluirCliente(id);
      setClientes(clientes.filter(c => c.id !== id));
      if (clienteSelecionado === id) setClienteSelecionado(null);
      setError(null);
    } catch (err) {
      setError('Erro ao excluir cliente. Tente novamente.');
    }
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

  const clienteNomeById = (id: number | null) => {
    if (!id) return '';
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nome : '';
  };

  return (
    <Layout title="Controle de Fiado">
      {error && <div className="error-message">{error}</div>}

      <div className="actions">
        <button className="btn btn-success" onClick={abrirModal}>
          <ShoppingCart size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Novo Fiado
        </button>
      </div>

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
                  <td>{formatarMoeda(venda.valor || venda.total)}</td>
                  <td className="acoes">
                    {venda.cliente_id && (
                      <button 
                        className="btn-icon btn-success" 
                        onClick={() => marcarComoPago(venda.id)}
                        title="Marcar como pago"
                      >
                        <Check size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Pago
                      </button>
                    )}
                    <button 
                      className="btn-icon btn-danger" 
                      onClick={() => excluirVenda(venda.id)}
                      title="Excluir venda"
                    >
                      <Trash2 size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para registrar novo fiado */}
      {modalAberto && (
        <div className="modal-backdrop">
          <div className="modal venda-modal" style={{ maxWidth: 420, padding: '2.5rem 2rem' }}>
            <h2 className="modal-title" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>Novo Fiado</h2>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label htmlFor="cliente" style={{ fontWeight: 600, fontSize: '1.1em' }}>Cliente</label>
              <div className="select-with-button" style={{ display: 'flex', gap: 10 }}>
                <select
                  id="cliente"
                  value={clienteSelecionado || ''}
                  onChange={(e) => setClienteSelecionado(e.target.value ? parseInt(e.target.value) : null)}
                  style={{ flex: 1, padding: '0.9em', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '1.1em', background: '#f8fafc' }}
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.referencia ? `(${cliente.referencia})` : ''}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={abrirModalCliente}
                  title="Adicionar novo cliente"
                  style={{ padding: '0.7em 1em', fontSize: '1.2em', borderRadius: 8 }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {clienteSelecionado && (
              <div className="cliente-info" style={{ background: '#f1f5f9', borderRadius: 8, padding: '1em', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 500 }}>Cliente: <strong>{clienteNomeById(clienteSelecionado)}</strong></span>
                  <button 
                    className="btn-icon btn-secondary" 
                    onClick={() => {
                      const cliente = clientes.find(c => c.id === clienteSelecionado);
                      if (cliente) abrirModalEditarCliente(cliente);
                    }}
                    title="Editar cliente"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => excluirCliente(clienteSelecionado)}
                    title="Excluir cliente"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {clientes.find(c => c.id === clienteSelecionado)?.referencia && (
                  <div className="cliente-referencia" style={{ color: '#64748b', fontSize: '0.98em', marginTop: 4 }}>
                    Ref: {clientes.find(c => c.id === clienteSelecionado)?.referencia}
                  </div>
                )}
                {clientes.find(c => c.id === clienteSelecionado)?.telefone && (
                  <div style={{ color: '#64748b', fontSize: '0.98em', marginTop: 2 }}>
                    WhatsApp: {clientes.find(c => c.id === clienteSelecionado)?.telefone}
                  </div>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 32 }}>
              <label htmlFor="valorFiado" style={{ fontWeight: 600, fontSize: '1.1em' }}>Valor Fiado</label>
              <input
                type="number"
                id="valorFiado"
                value={valorFiado}
                onChange={(e) => setValorFiado(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.01"
                placeholder="0,00"
                style={{
                  fontSize: '2.2em',
                  padding: '0.5em 0.7em',
                  borderRadius: 10,
                  border: '2px solid #d1d5db',
                  width: '100%',
                  background: '#f8fafc',
                  color: '#2563eb',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: 1
                }}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'center', gap: 18, marginTop: 32 }}>
              <button type="button" className="btn btn-secondary" onClick={fecharModal} style={{ padding: '0.8em 2em', fontSize: '1.1em', borderRadius: 8 }}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={registrarFiado}
                disabled={!clienteSelecionado || valorFiado <= 0}
                style={{ padding: '0.8em 2em', fontSize: '1.1em', borderRadius: 8, fontWeight: 600 }}
              >
                <Check size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Registrar Fiado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar novo cliente */}
      {modalClienteAberto && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">Novo Cliente</h2>
            <form onSubmit={(e) => { e.preventDefault(); salvarNovoCliente(); }}>
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={novoCliente.nome}
                  onChange={handleInputNovoCliente}
                  required
                  autoFocus
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={novoCliente.telefone}
                  onChange={handleInputNovoCliente}
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>

              <div className="form-group">
                <label htmlFor="referencia">Referência (opcional)</label>
                <input
                  type="text"
                  id="referencia"
                  name="referencia"
                  value={novoCliente.referencia}
                  onChange={handleInputNovoCliente}
                  placeholder="Ex: Vizinho da esquina, Dono do mercadinho, etc."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={fecharModalCliente}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar cliente */}
      {modalEditarClienteAberto && clienteEditando && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">Editar Cliente</h2>
            <form onSubmit={(e) => { e.preventDefault(); atualizarCliente(); }}>
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={clienteEditando.nome}
                  onChange={handleInputEditarCliente}
                  required
                  autoFocus
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={clienteEditando.telefone}
                  onChange={handleInputEditarCliente}
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>

              <div className="form-group">
                <label htmlFor="referencia">Referência (opcional)</label>
                <input
                  type="text"
                  id="referencia"
                  name="referencia"
                  value={clienteEditando.referencia || ''}
                  onChange={handleInputEditarCliente}
                  placeholder="Ex: Vizinho da esquina, Dono do mercadinho, etc."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={fecharModalEditarCliente}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Vendas;