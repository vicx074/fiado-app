import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, BarChart } from 'lucide-react';
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
          <Link to="/">
            <span className="logo-icon">₿</span>
            <span className="logo-text">Controle de Fiado</span>
          </Link>
        </div>
        
        <div className="navbar-menu">
          <Link to="/" className={`navbar-item ${isActive('/')}`}>
            <Home size={18} style={{marginRight: 6}} />
            <span>Dashboard</span>
          </Link>
          <Link to="/vendas" className={`navbar-item ${isActive('/vendas')}`}>
            <FileText size={18} style={{marginRight: 6}} />
            <span>Vendas</span>
          </Link>
          <Link to="/relatorios" className={`navbar-item ${isActive('/relatorios')}`}>
            <BarChart size={18} style={{marginRight: 6}} />
            <span>Relatórios</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;