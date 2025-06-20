import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { relatorioService } from '../services/relatorioService';
import { ResumoRelatorio } from '../types';
import './styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const [resumo, setResumo] = useState<ResumoRelatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarResumo = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await relatorioService.obterResumo();
      setResumo(dados);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
      setError('Não foi possível carregar o resumo. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  return (
    <Layout title="Dashboard">
      {loading ? (
        <div className="loading">Carregando...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="dashboard">
          <div className="stats-container">
            <div className="stat-card">
              <h3>Total de Vendas</h3>
              <p className="stat-value">{resumo?.total_vendas || 0}</p>
            </div>
            
            <div className="stat-card">
              <h3>Faturamento Total</h3>
              <p className="stat-value">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(resumo?.faturamento_total || 0)}
              </p>
            </div>
          </div>

          <div className="info-cards">
            {resumo?.produto_mais_vendido && (
              <div className="info-card">
                <h3>Produto Mais Vendido</h3>
                <p className="info-name">{resumo.produto_mais_vendido.nome}</p>
                <p className="info-detail">
                  {resumo.produto_mais_vendido.quantidade_vendida} unidades vendidas
                </p>
              </div>
            )}
            
            {resumo?.cliente_mais_compras && (
              <div className="info-card">
                <h3>Cliente Com Mais Compras</h3>
                <p className="info-name">{resumo.cliente_mais_compras.nome}</p>
                <p className="info-detail">
                  {resumo.cliente_mais_compras.quantidade_compras} compras realizadas
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard; 