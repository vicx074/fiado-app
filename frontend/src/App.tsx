import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Relatorios from './pages/Relatorios';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/vendas" element={
            <PrivateRoute>
              <Vendas />
            </PrivateRoute>
          } />
          
          <Route path="/relatorios" element={
            <PrivateRoute>
              <Relatorios />
            </PrivateRoute>
          } />

          {/* Redirecionar qualquer rota desconhecida para o dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
