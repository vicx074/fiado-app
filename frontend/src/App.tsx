import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Relatorios from './pages/Relatorios';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
