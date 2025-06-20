import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import './styles/Layout.css';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        {title && <h1 className="page-title">{title}</h1>}
        {children}
      </main>
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Controle de Fiado - Sistema para pequenos comerciantes</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 