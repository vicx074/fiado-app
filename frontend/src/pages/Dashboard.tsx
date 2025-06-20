import React, { useState, useEffect, useCallback } from 'react';
import { clienteService } from '../services/clienteService';
import { vendaService } from '../services/vendaService';
import Layout from '../components/Layout';
import { Cliente, Venda } from '../types';
import { Users, DollarSign, ShoppingCart, AlertTriangle, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import './styles/Dashboard.css';

interface DashboardData {
  totalClientes: number;
  totalFiado: number;
  totalVendas: number;
  topClientes: Cliente[];
  ultimasVendas: Venda[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalClientes: 0,
    totalFiado: 0,
    totalVendas: 0,
    topClientes: [],
    ultimasVendas: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      
      const clientes = await clienteService.listarClientes();
      const vendas = await vendaService.listarVendas();
      
      const totalClientes = clientes.length;
      const totalFiado = clientes.reduce((acc, cliente) => acc + cliente.fiado, 0);
      const totalVendas = vendas.length;
      
      // Ordenar os clientes por valor de fiado (maior para menor)
      const topClientes = [...clientes]
        .filter(cliente => cliente.fiado > 0)
        .sort((a, b) => b.fiado - a.fiado)
        .slice(0, 10); // Mostrar mais clientes
      
      // Ordenar por data mais recente
      const ultimasVendas = [...vendas]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);
      
      setData({
        totalClientes,
        totalFiado,
        totalVendas,
        topClientes,
        ultimasVendas
      });
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(data);
  };

  return (
    <Layout title="Dashboard">
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Carregando dados...</div>
      ) : (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-card-icon clients">
                <Users />
              </div>
              <div className="stat-card-content">
                <div className="stat-card-title">Total de Clientes</div>
                <div className="stat-card-value">{data.totalClientes}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-card-icon sales">
                <ShoppingCart />
              </div>
              <div className="stat-card-content">
                <div className="stat-card-title">Total de Vendas</div>
                <div className="stat-card-value">{data.totalVendas}</div>
              </div>
            </div>
          </div>
        
          <div className="dashboard-grid">
            <div className="card top-clientes-card">
              <div className="card-header">
                <h2 className="card-title">
                  <AlertTriangle className="icon-warning" />
                  Clientes com Fiado Pendente
                </h2>
                <Link to="/vendas" className="btn btn-primary">
                  <UserCog /> Gerenciar Clientes
                </Link>
              </div>
              
              {data.topClientes.length === 0 ? (
                <div className="empty-state">Nenhum cliente com fiado pendente</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Referência</th>
                        <th>Telefone</th>
                        <th>Valor Pendente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topClientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>{cliente.nome}</td>
                          <td>{cliente.referencia || '-'}</td>
                          <td>{cliente.telefone || '-'}</td>
                          <td className="fiado-value">{formatarMoeda(cliente.fiado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;