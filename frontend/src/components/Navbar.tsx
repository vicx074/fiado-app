import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './styles/Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/">Controle de Fiado</Link>
        </div>
        
        <div className="navbar-menu">
          <Link to="/" className={`navbar-item ${isActive('/')}`}>
            Dashboard
          </Link>
          <Link to="/clientes" className={`navbar-item ${isActive('/clientes')}`}>
            Clientes
          </Link>
          <Link to="/produtos" className={`navbar-item ${isActive('/produtos')}`}>
            Produtos
          </Link>
          <Link to="/vendas" className={`navbar-item ${isActive('/vendas')}`}>
            Vendas
          </Link>
          <Link to="/relatorios" className={`navbar-item ${isActive('/relatorios')}`}>
            Relatórios
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 