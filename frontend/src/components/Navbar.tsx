import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, BarChart, LogOut } from 'lucide-react';
import { authService } from '../services/authService';
import './styles/Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = authService.getUsuarioAtual();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/">
            <span className="logo-icon">₿</span>
            <span className="logo-text">Pague Depois</span>
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
          {usuario && (
            <div className="navbar-user-area">
              <span className="navbar-user">{usuario.nome}</span>
              <button className="navbar-logout" onClick={handleLogout} title="Sair">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;