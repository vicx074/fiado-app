import React from 'react';
import Navbar from './Navbar';
import './styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <div className="content-container">
          {title && <h1 className="page-title">{title}</h1>}
          {children}
        </div>
      </main>
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Pague Depois - Sistema para pequenos comerciantes</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;